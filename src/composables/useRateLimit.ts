import { computed, ref } from 'vue'

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number // Janela de tempo em milissegundos
  blockDurationMs?: number // Duração do bloqueio após exceder limite
}

interface RateLimitState {
  attempts: number
  firstAttemptTime: number
  blockedUntil: number | null
}

/**
 * Composable para implementar rate limiting (limitação de taxa)
 * Previne brute force attacks limitando tentativas em janela de tempo
 *
 * @example
 * const loginRateLimit = useRateLimit({
 *   maxAttempts: 5,
 *   windowMs: 15 * 60 * 1000, // 15 minutos
 *   blockDurationMs: 30 * 60 * 1000 // Bloqueia por 30 minutos
 * })
 */
export function useRateLimit (key: string, config: RateLimitConfig) {
  const {
    maxAttempts,
    windowMs,
    blockDurationMs = 30 * 60 * 1000, // Padrão: 30 minutos
  } = config

  // Chave única para localStorage
  const storageKey = `rate_limit_${key}`

  // Estado reativo
  const state = ref<RateLimitState>(loadState())

  // Verifica se está bloqueado
  const isBlocked = computed(() => {
    if (!state.value.blockedUntil) {
      return false
    }

    const now = Date.now()
    if (now < state.value.blockedUntil) {
      return true
    }

    // Bloqueio expirou, limpar estado
    reset()
    return false
  })

  // Tempo restante de bloqueio (em segundos)
  const blockedTimeRemaining = computed(() => {
    if (!state.value.blockedUntil) {
      return 0
    }

    const remaining = Math.ceil((state.value.blockedUntil - Date.now()) / 1000)
    return Math.max(0, remaining)
  })

  // Número de tentativas restantes
  const attemptsRemaining = computed(() => {
    if (isBlocked.value) {
      return 0
    }
    return Math.max(0, maxAttempts - state.value.attempts)
  })

  // Progresso (0-100%)
  const progress = computed(() => {
    return (state.value.attempts / maxAttempts) * 100
  })

  /**
   * Carrega estado do localStorage
   */
  function loadState (): RateLimitState {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as RateLimitState

        // Verificar se a janela de tempo expirou
        const now = Date.now()
        if (now - parsed.firstAttemptTime > windowMs && !parsed.blockedUntil) {
          // Janela expirou, resetar
          return {
            attempts: 0,
            firstAttemptTime: 0,
            blockedUntil: null,
          }
        }

        return parsed
      }
    } catch (error) {
      console.error('[RateLimit] Erro ao carregar estado:', error)
    }

    return {
      attempts: 0,
      firstAttemptTime: 0,
      blockedUntil: null,
    }
  }

  /**
   * Salva estado no localStorage
   */
  function saveState () {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.value))
    } catch (error) {
      console.error('[RateLimit] Erro ao salvar estado:', error)
    }
  }

  /**
   * Registra uma tentativa
   * @returns true se permitido, false se bloqueado
   */
  function attempt (): boolean {
    // Se já está bloqueado, negar
    if (isBlocked.value) {
      console.warn(`[RateLimit] Bloqueado. Aguarde ${blockedTimeRemaining.value}s`)
      return false
    }

    const now = Date.now()

    // Se é a primeira tentativa ou janela expirou
    if (state.value.attempts === 0 || now - state.value.firstAttemptTime > windowMs) {
      state.value.firstAttemptTime = now
      state.value.attempts = 1
      saveState()
      return true
    }

    // Incrementar tentativas
    state.value.attempts++

    // Verificar se excedeu o limite
    if (state.value.attempts >= maxAttempts) {
      state.value.blockedUntil = now + blockDurationMs
      console.warn(`[RateLimit] Limite excedido! Bloqueado por ${blockDurationMs / 1000}s`)
    }

    saveState()
    return state.value.attempts <= maxAttempts
  }

  /**
   * Reseta o contador (usar após sucesso, por exemplo)
   */
  function reset () {
    state.value = {
      attempts: 0,
      firstAttemptTime: 0,
      blockedUntil: null,
    }
    saveState()
  }

  /**
   * Verifica se pode fazer tentativa sem incrementar contador
   */
  function canAttempt (): boolean {
    return !isBlocked.value && attemptsRemaining.value > 0
  }

  return {
    // Estado
    isBlocked,
    blockedTimeRemaining,
    attemptsRemaining,
    progress,
    attempts: computed(() => state.value.attempts),

    // Métodos
    attempt,
    reset,
    canAttempt,
  }
}
