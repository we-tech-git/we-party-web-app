/**
 * useAuth Composable
 * Gerencia estado reativo de autenticação e navegação
 */

import { computed, ref } from 'vue'
import { AuthService, type LoggedUser } from '@/services/auth'

// Estado global reativo da autenticação
const isAuthenticated = ref(AuthService.isAuthenticated())
const accessToken = ref(AuthService.getToken())
const loggedUser = ref(AuthService.getUser())

// Guard para evitar múltiplos setInterval (memory leak)
let watcherStarted = false

// Watcher para monitorar mudanças no localStorage
function startAuthWatcher () {
  if (watcherStarted) {
    return
  }
  watcherStarted = true

  // Monitora mudanças no localStorage (outras abas)
  window.addEventListener('storage', e => {
    if (e.key === 'ACCESS_TOKEN' || e.key === 'LOGGED_USER') {
      refreshAuthState()
    }
  })

  // Monitora mudanças no próprio tab
  setInterval(() => {
    const currentToken = AuthService.getToken()
    const currentUser = AuthService.getUser()

    if (currentToken !== accessToken.value
      || JSON.stringify(currentUser) !== JSON.stringify(loggedUser.value)) {
      refreshAuthState()
    }
  }, 2000) // Verifica a cada 2 segundos
}

// Atualiza o estado reativo com dados atuais do localStorage
function refreshAuthState () {
  accessToken.value = AuthService.getToken()
  loggedUser.value = AuthService.getUser()
  isAuthenticated.value = AuthService.isAuthenticated()
}

export function useAuth () {
  // Estados reativos
  const isFullyAuthenticated = computed(() =>
    !!(accessToken.value && loggedUser.value),
  )

  const userDisplayName = computed(() =>
    loggedUser.value?.name || loggedUser.value?.username || 'Usuário',
  )

  const userRoles = computed(() =>
    loggedUser.value?.roles || [],
  )

  // Funções de autenticação
  const login = (token: string, user: LoggedUser) => {
    AuthService.saveAuthData({
      success: true,
      message: 'Login realizado',
      token,
      user,
    })
    refreshAuthState()
  }

  const logout = () => {
    AuthService.logout()
    refreshAuthState()
  }

  const hasRole = (role: string) => {
    return AuthService.hasRole(role)
  }

  const hasAnyRole = (roles: string[]) => {
    return AuthService.hasAnyRole(roles)
  }

  const updateUser = (userData: Partial<typeof loggedUser.value>) => {
    AuthService.updateUser(userData as any)
    refreshAuthState()
  }

  // Inicia o monitoramento quando o composable é usado
  if (typeof window !== 'undefined') {
    startAuthWatcher()
  }

  return {
    // Estados
    isAuthenticated,
    isFullyAuthenticated,
    accessToken,
    loggedUser,
    userDisplayName,
    userRoles,

    // Funções
    login,
    logout,
    hasRole,
    hasAnyRole,
    refreshAuthState,
    updateUser,

    // Utilitários
    debugAuth: AuthService.debugAuth,
  }
}

/**
 * Guards de navegação para uso no router
 */
export function privateRouteGuard () {
  const authenticated = AuthService.isAuthenticated()
  const user = AuthService.getUser()

  if (!authenticated) {
    return '/public/Login'
  }

  if (user && user.isEmailVerified === false) {
    return '/public/ConfirmEmail'
  }

  return true
}

export function publicRouteGuard () {
  const authenticated = AuthService.isAuthenticated()

  if (authenticated) {
    return '/private/feed'
  }

  return true
}

/**
 * Guard para roles específicas
 */
export function roleGuard (requiredRoles: string[]) {
  if (!AuthService.isAuthenticated()) {
    return '/public/Login'
  }

  if (!AuthService.hasAnyRole(requiredRoles)) {
    return '/private/unauthorized'
  }

  return true
}
