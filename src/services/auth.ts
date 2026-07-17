/**
 * AuthService
 * Serviço para gerenciar autenticação e dados no localStorage
 *
 * ⚠️ NOTA DE SEGURANÇA:
 * - Tokens JWT são armazenados em localStorage (vulnerável a XSS)
 * - Dados do usuário são armazenados em localStorage (visíveis no DevTools)
 * - Mitigação: CSP headers implementado para prevenir scripts maliciosos
 * - Melhoria futura: migrar para httpOnly cookies (requer mudanças no backend)
 */

import { STORAGE_KEYS } from '@/common/storage'
import { logger } from '@/utils/logger'

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: LoggedUser
}

export interface LoggedUser {
  id: string
  username: string
  name: string
  email: string
  roles: string[]
  isEmailVerified?: boolean
  profileImage?: string
}

// ===========================================
// SEGURANÇA: Campos que são seguros para exibição
// ===========================================
export interface SafeUserData {
  id: string
  username: string
  name: string
  profileImage?: string
}

export const AuthService = {
  /**
   * Salva os dados de autenticação no localStorage
   * ⚠️ SEGURANÇA: Dados são armazenados em texto plano
   */
  saveAuthData (response: LoginResponse): void {
    if (response.token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.token)
    }

    if (response.user) {
      localStorage.setItem(
        STORAGE_KEYS.LOGGED_USER,
        JSON.stringify(response.user),
      )
    }
  },

  /**
   * Recupera o token do localStorage
   */
  getToken (): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  },

  /**
   * Recupera os dados do usuário logado do localStorage
   */
  getUser (): LoggedUser | null {
    const userData = localStorage.getItem(STORAGE_KEYS.LOGGED_USER)
    if (!userData) {
      return null
    }

    try {
      return JSON.parse(userData) as LoggedUser
    } catch (error) {
      logger.error('Erro ao parsear dados do usuário:', error)
      return null
    }
  },

  /**
   * SEGURANÇA: Retorna apenas dados seguros do usuário (sem email/roles)
   * Use esta função para exibição em componentes não-sensíveis
   */
  getSafeUserData (): SafeUserData | null {
    const user = this.getUser()
    if (!user) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      profileImage: user.profileImage,
    }
  },

  /**
   * SEGURANÇA: Retorna email mascarado para exibição
   * Ex: "usuario@exemplo.com" → "u****o@e****o.com"
   */
  getMaskedEmail (): string | null {
    const user = this.getUser()
    if (!user?.email) {
      return null
    }

    const [localPart, domain] = user.email.split('@')
    if (!localPart || !domain) {
      return user.email
    }

    const maskString = (str: string): string => {
      if (str.length <= 2) {
        return str
      }
      return str[0] + '*'.repeat(Math.min(4, str.length - 2)) + str.at(-1)
    }

    const [domainName, ...rest] = domain.split('.')
    const maskedDomain = [maskString(domainName || ''), ...rest].join('.')

    return `${maskString(localPart)}@${maskedDomain}`
  },

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated (): boolean {
    const token = this.getToken()
    const user = this.getUser()
    return !!(token && user)
  },

  /**
   * Verifica se possui token válido (inclui verificação de expiração)
   * SEGURANÇA: Decodifica JWT e verifica claim 'exp'
   */
  hasValidToken (): boolean {
    const token = this.getToken()
    if (!token || token.length === 0) {
      return false
    }

    try {
      // Decodifica o payload do JWT (parte central)
      const parts = token.split('.')
      if (parts.length !== 3) {
        return false
      }

      const payloadPart = parts[1]
      if (!payloadPart) {
        return false
      }

      const payload = JSON.parse(atob(payloadPart))

      // Rejeita tokens sem claim de expiração — política de segurança
      if (!payload.exp) {
        logger.warn('[AUTH] Token sem claim de expiração — rejeitado')
        this.logout()
        return false
      }

      // Verifica se o token já passou do prazo de expiração
      const now = Math.floor(Date.now() / 1000)
      const isExpired = payload.exp <= now

      if (isExpired) {
        logger.warn('[AUTH] Token expirado, fazendo logout automático')
        this.logout()
        return false
      }

      return true
    } catch (error) {
      logger.error('[AUTH] Erro ao validar token:', error)
      return false
    }
  },

  /**
   * Verifica se possui dados de usuário válidos
   */
  hasValidUser (): boolean {
    const user = this.getUser()
    return !!(user && user.id && user.email)
  },

  /**
   * Atualiza os dados do usuário no localStorage (mantém o token)
   */
  updateUser (userData: Partial<LoggedUser>): void {
    const currentUser = this.getUser()
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData }
      localStorage.setItem(
        STORAGE_KEYS.LOGGED_USER,
        JSON.stringify(updatedUser),
      )
    }
  },

  /**
   * Remove todos os dados de autenticação (logout)
   * Dispara 'weparty:auth-changed' para que o estado reativo do useAuth
   * (compartilhado entre toda a UI) seja atualizado, mesmo quando chamado
   * fora do composable (ex.: interceptor de 401, exclusão de conta).
   */
  logout (): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.LOGGED_USER)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID)
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_ID)
    window.dispatchEvent(new CustomEvent('weparty:auth-changed'))
  },

  /**
   * Limpa apenas o token (mantém dados do usuário)
   */
  clearToken (): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  },

  /**
   * Verifica se o usuário tem uma role específica
   */
  hasRole (role: string): boolean {
    const user = this.getUser()
    return user?.roles?.includes(role) || false
  },

  /**
   * Verifica se o usuário tem pelo menos uma das roles especificadas
   */
  hasAnyRole (roles: string[]): boolean {
    const user = this.getUser()
    if (!user?.roles) {
      return false
    }

    return roles.some(role => user.roles.includes(role))
  },

}
