/**
 * AuthService
 * Serviço para gerenciar autenticação e dados no localStorage
 */

import { STORAGE_KEYS } from '@/common/storage'

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

export const AuthService = {
  /**
   * Salva os dados de autenticação no localStorage
   */
  saveAuthData (response: LoginResponse): void {
    if (response.token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.token)
      console.log('✅ Token salvo:', STORAGE_KEYS.ACCESS_TOKEN)
    }

    if (response.user) {
      localStorage.setItem(STORAGE_KEYS.LOGGED_USER, JSON.stringify(response.user))
      console.log('✅ Usuário salvo:', STORAGE_KEYS.LOGGED_USER)
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
      console.error('Erro ao parsear dados do usuário:', error)
      return null
    }
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
   * Verifica se possui token válido
   */
  hasValidToken (): boolean {
    const token = this.getToken()
    return !!(token && token.length > 0)
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
      localStorage.setItem(STORAGE_KEYS.LOGGED_USER, JSON.stringify(updatedUser))
      console.log('✅ Dados do usuário atualizados:', updatedUser)
    }
  },

  /**
   * Remove todos os dados de autenticação (logout)
   */
  logout (): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.LOGGED_USER)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID)
    console.log('✅ Logout realizado - dados removidos do localStorage')
  },

  /**
   * Limpa apenas o token (mantém dados do usuário)
   */
  clearToken (): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    console.log('✅ Token removido do localStorage')
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

  /**
   * Debug: mostra informações de autenticação no console
   */
  debugAuth (): void {
    console.group('🔍 Auth Debug Info')
    console.log('Token:', this.getToken() ? '✅ Presente' : '❌ Ausente')
    console.log('Usuário:', this.getUser() ? '✅ Presente' : '❌ Ausente')
    console.log('Autenticado:', this.isAuthenticated() ? '✅ Sim' : '❌ Não')
    console.log('Dados completos:', {
      token: this.getToken(),
      user: this.getUser(),
    })
    console.groupEnd()
  },
}
