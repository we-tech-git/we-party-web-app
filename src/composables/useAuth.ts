/**
 * useAuth Composable
 * Gerencia estado reativo de autenticação e navegação
 */

import { computed, ref, watch } from 'vue'
import { AuthService, type LoggedUser } from '@/services/auth'

// Estado global reativo da autenticação
const isAuthenticated = ref(AuthService.isAuthenticated())
const accessToken = ref(AuthService.getToken())
const loggedUser = ref(AuthService.getUser())

// Watcher para monitorar mudanças no localStorage
const startAuthWatcher = () => {
  // Monitora mudanças no localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'ACCESS_TOKEN' || e.key === 'LOGGED_USER') {
      refreshAuthState()
    }
  })

  // Monitora mudanças no próprio tab
  const checkInterval = setInterval(() => {
    const currentToken = AuthService.getToken()
    const currentUser = AuthService.getUser()

    if (currentToken !== accessToken.value ||
        JSON.stringify(currentUser) !== JSON.stringify(loggedUser.value)) {
      refreshAuthState()
    }
  }, 1000) // Verifica a cada segundo

  // Retorna função para limpar o intervalo
  return () => {
    clearInterval(checkInterval)
  }
}

// Atualiza o estado reativo com dados atuais do localStorage
const refreshAuthState = () => {
  accessToken.value = AuthService.getToken()
  loggedUser.value = AuthService.getUser()
  isAuthenticated.value = AuthService.isAuthenticated()
}

export function useAuth () {
  // Estados reativos
  const isFullyAuthenticated = computed(() =>
    !!(accessToken.value && loggedUser.value)
  )

  const userDisplayName = computed(() =>
    loggedUser.value?.name || loggedUser.value?.username || 'Usuário'
  )

  const userRoles = computed(() =>
    loggedUser.value?.roles || []
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
    console.log('🚪 Logout realizado')
  }

  const hasRole = (role: string) => {
    return AuthService.hasRole(role)
  }

  const hasAnyRole = (roles: string[]) => {
    return AuthService.hasAnyRole(roles)
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

    // Utilitários
    debugAuth: AuthService.debugAuth,
  }
}

/**
 * Guards de navegação para uso no router
 */
export const privateRouteGuard = () => {
  const authenticated = AuthService.isAuthenticated()

  if (!authenticated) {
    console.log('🔒 Acesso negado - usuário não autenticado')
    return '/public/Login' // Redireciona para login
  }

  console.log('✅ Acesso permitido - usuário autenticado')
  return true // Permite acesso
}

export const publicRouteGuard = () => {
  const authenticated = AuthService.isAuthenticated()

  if (authenticated) {
    console.log('✅ Usuário já autenticado, redirecionando para área privada')
    return '/private/feed' // Redireciona para área privada
  }

  return true // Permite acesso às rotas públicas
}

/**
 * Guard para roles específicas
 */
export const roleGuard = (requiredRoles: string[]) => {
  if (!AuthService.isAuthenticated()) {
    console.log('🔒 Acesso negado - usuário não autenticado')
    return '/public/Login'
  }

  if (!AuthService.hasAnyRole(requiredRoles)) {
    console.log('🔒 Acesso negado - role insuficiente')
    return '/private/unauthorized'
  }

  console.log('✅ Acesso permitido - role válida')
  return true
}
