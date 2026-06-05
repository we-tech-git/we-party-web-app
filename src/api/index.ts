import axios from 'axios'
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

export async function callApi (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: string | DynamicObject,
  auth?: boolean,
  customHeaders?: DynamicObject,
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

  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
      // ===========================================
      // SEGURANÇA: Permite envio de cookies (necessário para CSRF)
      // ===========================================
      withCredentials: true,
      // ===========================================
      // PERFORMANCE: Timeout e connection keep-alive
      // ===========================================
      timeout: 30000,
      httpAgent: { keepAlive: true },
      httpsAgent: { keepAlive: true },
    })

    // logger.log(`✅ [API] ${method} ${url} - Status: ${response.status}`)

    return response
  } catch (error: any) {
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
