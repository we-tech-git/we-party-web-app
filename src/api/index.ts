import axios from 'axios'
import { HTTP_RETRY_BASE_MS, HTTP_RETRY_MAX, HTTP_RETRY_MAX_WAIT_MS } from '@/constants/timing'
import router from '@/router'
import { AuthService } from '@/services/auth'
import { logger } from '@/utils/logger'

interface DynamicObject {
  [key: string]: any
}

// ===========================================
// SEGURANÇA: Suporte a CSRF Token
// ===========================================
// Lê o CSRF token do cookie (quando backend implementar)
// Padrão: backend envia cookie "XSRF-TOKEN", frontend envia header "X-XSRF-TOKEN"
function getCsrfToken (): string | null {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if ((name === 'XSRF-TOKEN' || name === 'csrf_token') && value) {
      return decodeURIComponent(value)
    }
  }
  return null
}

// Verifica se o método requer proteção CSRF
function requiresCsrf (method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())
}

/**
 * Indica se um erro foi causado pelo cancelamento da requisição
 * (AbortController). Útil para os fluxos de busca ignorarem requisições
 * abortadas sem exibir erro ao usuário.
 */
export function isRequestCanceled (error: unknown): boolean {
  return axios.isCancel(error)
}

// ===========================================
// NORMALIZAÇÃO DE RESPOSTAS
// ===========================================
// O backend retorna listas em envelopes variados — { data: { events: [] } },
// { events: [] }, { data: [] } ou o array direto. Estes helpers concentram a
// extração num único ponto: se o formato mudar, corrige-se apenas aqui.

/**
 * Extrai uma lista da resposta da API, aceitando todos os envelopes conhecidos.
 * @param response - resposta do axios (retorno de callApi)
 * @param keys - propriedades onde a lista pode estar (ex.: 'events', 'content')
 */
export function unwrapList<T = any> (response: any, ...keys: string[]): T[] {
  const data = response?.data
  for (const source of [data?.data, data]) {
    if (!source) {
      continue
    }
    if (Array.isArray(source)) {
      return source
    }
    for (const key of keys) {
      if (Array.isArray(source[key])) {
        return source[key]
      }
    }
  }
  return []
}

/**
 * Extrai um objeto único (perfil, evento, stats) do envelope
 * { data: {...} } ou da resposta plana.
 */
export function unwrapItem<T = any> (response: any): T | null {
  return response?.data?.data ?? response?.data ?? null
}

/**
 * Extrai o tempo de espera (ms) do header `Retry-After`, que pode vir como
 * segundos (ex.: "5") ou como data HTTP (ex.: "Wed, 21 Oct 2026 07:28:00 GMT").
 * Retorna null se o header estiver ausente ou for inválido.
 */
function parseRetryAfterMs (headerValue: unknown): number | null {
  if (typeof headerValue !== 'string' || !headerValue) {
    return null
  }

  const asSeconds = Number(headerValue)
  if (!Number.isNaN(asSeconds)) {
    return asSeconds * 1000
  }

  const asDate = Date.parse(headerValue)
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now())
  }

  return null
}

export async function callApi (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: string | DynamicObject,
  auth?: boolean,
  customHeaders?: DynamicObject,
  signal?: AbortSignal,
): Promise<any> {
  let headers: any = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  // ===========================================
  // SEGURANÇA: Adiciona CSRF token em requisições que modificam dados
  // ===========================================
  if (requiresCsrf(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken
    }
  }

  if (auth) {
    const token = localStorage.getItem('ACCESS_TOKEN')
    headers = {
      ...headers,
      Authorization: `Bearer ${token}`,
    }
  }

  url = `${import.meta.env.VITE__BASE_URL}${url}`

  // logger.log(`🌐 [API] ${method} ${url}`, auth ? '🔒 auth' : '')

  let attempt = 0

  while (true) {
    try {
      const response = await axios({
        method,
        url,
        data,
        headers,
        // ===========================================
        // CANCELAMENTO: permite abortar a requisição via AbortController
        // (usado nos fluxos de busca para evitar respostas fora de ordem)
        // ===========================================
        signal,
        // ===========================================
        // SEGURANÇA: Permite envio de cookies (necessário para CSRF)
        // ===========================================
        withCredentials: true,
        // ===========================================
        // PERFORMANCE: Timeout
        // ===========================================
        timeout: 30_000,
      })

      // logger.log(`✅ [API] ${method} ${url} - Status: ${response.status}`)

      return response
    } catch (error: any) {
      // Requisição cancelada (AbortController): não é erro real — repassa em silêncio
      if (axios.isCancel(error)) {
        throw error
      }

      // ===========================================
      // RESILIÊNCIA: retry com backoff em 429, apenas para GET (idempotente).
      // Nunca reenvia POST/PUT/DELETE/PATCH automaticamente, para não
      // duplicar ações (login, comentário, follow, etc.).
      // ===========================================
      if (
        method === 'GET'
        && error.response?.status === 429
        && attempt < HTTP_RETRY_MAX
        && !signal?.aborted
      ) {
        const retryAfterMs = parseRetryAfterMs(error.response.headers?.['retry-after'])
        const backoffMs = HTTP_RETRY_BASE_MS * 2 ** attempt
        const waitMs = Math.min(retryAfterMs ?? backoffMs, HTTP_RETRY_MAX_WAIT_MS)

        logger.warn(`⏳ [API] ${method} ${url} - 429 recebido, nova tentativa em ${waitMs}ms (${attempt + 1}/${HTTP_RETRY_MAX})`)

        await new Promise(resolve => setTimeout(resolve, waitMs))
        attempt++
        continue
      }

      logger.error(`❌ [API] ${method} ${url} - Erro:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      })

      // Só faz logout se havia um usuário logado E recebeu erro de autenticação
      const hadToken = localStorage.getItem('ACCESS_TOKEN')
      if (
        hadToken
        && (error.response?.status === 401
          || error.response?.data?.erros?.[0] === 'Invalid JWT token'
          || error.response?.data?.erros?.[0]
          === 'Required request header \'auth\' for method parameter type String is not present')
      ) {
        AuthService.logout()
        router.push('/')
      }

      throw error
    }
  }
}
