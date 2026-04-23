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
let authIntervalId: ReturnType<typeof setInterval> | null = null

// ===============================
// TIMEOUT DE SESSÃO (Segurança)
// ===============================
// Configurações de timeout de inatividade
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']
let inactivityTimer: ReturnType<typeof setTimeout> | null = null
let activityListenersAttached = false

/**
 * Reseta o timer de inatividade
 * Chamado sempre que o usuário interage com a aplicação
 */
function resetInactivityTimer () {
  // Limpa timer anterior
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }

  // Só inicia timer se usuário estiver autenticado
  if (!isAuthenticated.value) {
    return
  }

  // Inicia novo timer de 30 minutos
  inactivityTimer = setTimeout(() => {
    console.warn('[AUTH] Sessão expirada por inatividade (30 minutos)')

    // Faz logout automático
    AuthService.logout()
    refreshAuthState()

    // Opcional: Redirecionar para login
    if (typeof window !== 'undefined') {
      window.location.href = '/public/Login?reason=inactivity'
    }
  }, INACTIVITY_TIMEOUT_MS)
}

/**
 * Anexa listeners de atividade do usuário
 * Monitora movimentos, cliques, teclas, etc.
 */
function attachActivityListeners () {
  if (activityListenersAttached || typeof window === 'undefined') {
    return
  }

  for (const eventName of ACTIVITY_EVENTS) {
    document.addEventListener(eventName, resetInactivityTimer, { passive: true })
  }

  activityListenersAttached = true

  // Inicia o primeiro timer
  resetInactivityTimer()
}

/**
 * Remove listeners de atividade
 * Chamado ao fazer logout ou limpar recursos
 */
function detachActivityListeners () {
  if (!activityListenersAttached || typeof window === 'undefined') {
    return
  }

  for (const eventName of ACTIVITY_EVENTS) {
    document.removeEventListener(eventName, resetInactivityTimer)
  }

  // Limpa timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }

  activityListenersAttached = false
}

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
  // SEGURANÇA: Salva referência para poder limpar depois
  authIntervalId = setInterval(() => {
    const currentToken = AuthService.getToken()
    const currentUser = AuthService.getUser()

    if (currentToken !== accessToken.value
      || JSON.stringify(currentUser) !== JSON.stringify(loggedUser.value)) {
      refreshAuthState()
    }
  }, 2000) // Verifica a cada 2 segundos

  // ===============================
  // TIMEOUT DE SESSÃO: Inicia monitoramento de atividade
  // ===============================
  if (isAuthenticated.value) {
    attachActivityListeners()
  }
}

// SEGURANÇA: Função para limpar o interval quando não for mais necessário
function stopAuthWatcher () {
  if (authIntervalId) {
    clearInterval(authIntervalId)
    authIntervalId = null
  }
  watcherStarted = false

  // ===============================
  // TIMEOUT DE SESSÃO: Remove listeners ao parar watcher
  // ===============================
  detachActivityListeners()
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

    // ===============================
    // TIMEOUT DE SESSÃO: Inicia monitoramento ao fazer login
    // ===============================
    attachActivityListeners()
  }

  const logout = () => {
    AuthService.logout()
    refreshAuthState()

    // ===============================
    // TIMEOUT DE SESSÃO: Para monitoramento ao fazer logout
    // ===============================
    detachActivityListeners()
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

    // Cleanup (SEGURANÇA: para evitar memory leaks)
    stopAuthWatcher,

    // Utilitários
    debugAuth: AuthService.debugAuth,
  }
}

/**
 * Guards de navegação para uso no router
 */
export function privateRouteGuard (path?: string) {
  const authenticated = AuthService.isAuthenticated()
  const user = AuthService.getUser()

  if (!authenticated) {
    // Se está tentando acessar o feed privado sem login, redireciona para explore público
    if (path?.includes('/private/feed')) {
      return '/public/explore'
    }
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
