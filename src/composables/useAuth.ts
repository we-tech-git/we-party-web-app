/**
 * useAuth Composable
 * Gerencia estado reativo de autenticação e navegação
 * SEGURANÇA: Implementa cleanup adequado para prevenir memory leaks
 */

import { computed, onBeforeUnmount, ref } from 'vue'
import { AuthService, type LoggedUser } from '@/services/auth'
import { useEventsStore } from '@/stores/events'
import { logger } from '@/utils/logger'

// Estado global reativo da autenticação
const isAuthenticated = ref(AuthService.isAuthenticated())
const accessToken = ref(AuthService.getToken())
const loggedUser = ref(AuthService.getUser())

// ===========================================
// SEGURANÇA: Dados seguros do usuário (sem email/roles)
// ===========================================
const safeUserData = ref(AuthService.getSafeUserData())
const maskedEmail = ref(AuthService.getMaskedEmail())

// ===========================================
// SEGURANÇA: Guards para prevenir memory leaks
// ===========================================
let watcherStarted = false
let watcherRefCount = 0
let storageHandler: ((e: StorageEvent) => void) | null = null
let authChangedHandler: (() => void) | null = null

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
    logger.warn('[AUTH] Sessão expirada por inatividade (30 minutos)')

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

  // Cria handler e guarda referência (SEGURANÇA: para poder remover depois)
  storageHandler = (e: StorageEvent) => {
    if (e.key === 'ACCESS_TOKEN' || e.key === 'LOGGED_USER') {
      refreshAuthState()
    }
  }

  // Monitora mudanças no localStorage (outras abas)
  window.addEventListener('storage', storageHandler)

  // Monitora mudanças na mesma aba via CustomEvent (disparado no login/logout)
  authChangedHandler = () => refreshAuthState()
  window.addEventListener('weparty:auth-changed', authChangedHandler)

  // ===============================
  // TIMEOUT DE SESSÃO: Inicia monitoramento de atividade
  // ===============================
  if (isAuthenticated.value) {
    attachActivityListeners()
  }
}

// SEGURANÇA: Função para limpar TODOS os recursos e prevenir memory leaks
function stopAuthWatcher () {
  // Remove listener de storage
  if (storageHandler) {
    window.removeEventListener('storage', storageHandler)
    storageHandler = null
  }

  // Remove listener de mudanças na mesma aba
  if (authChangedHandler) {
    window.removeEventListener('weparty:auth-changed', authChangedHandler)
    authChangedHandler = null
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
  // SEGURANÇA: Atualiza dados seguros também
  safeUserData.value = AuthService.getSafeUserData()
  maskedEmail.value = AuthService.getMaskedEmail()
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
    window.dispatchEvent(new CustomEvent('weparty:auth-changed'))

    // ===============================
    // TIMEOUT DE SESSÃO: Inicia monitoramento ao fazer login
    // ===============================
    attachActivityListeners()
  }

  const logout = () => {
    // Limpa o estado de eventos antes do logout
    try {
      const eventsStore = useEventsStore()
      eventsStore.clearAll()
    } catch {
      // Ignora se o store não estiver disponível
    }

    AuthService.logout()
    refreshAuthState()
    window.dispatchEvent(new CustomEvent('weparty:auth-changed'))

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

  // Inicia o monitoramento quando o composable é usado pela primeira vez
  // e incrementa o contador de componentes ativos
  if (typeof window !== 'undefined') {
    watcherRefCount++
    startAuthWatcher()
  }

  // ===========================================
  // SEGURANÇA: Cleanup via contador de referências
  // O watcher global só para quando o ÚLTIMO componente que o usa é desmontado
  // ===========================================
  onBeforeUnmount(() => {
    watcherRefCount--
    if (watcherRefCount <= 0) {
      watcherRefCount = 0
      stopAuthWatcher()
    }
  })

  return {
    // Estados
    isAuthenticated,
    isFullyAuthenticated,
    accessToken,
    loggedUser,
    userDisplayName,
    userRoles,

    // SEGURANÇA: Dados seguros (sem email/roles sensíveis)
    safeUserData,
    maskedEmail,

    // Funções
    login,
    logout,
    hasRole,
    hasAnyRole,
    refreshAuthState,
    updateUser,

    // Cleanup (SEGURANÇA: para evitar memory leaks)
    stopAuthWatcher,
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
