/**
 * useThrottle Composable
 * Implementa throttle e debounce para controle de rate limiting
 * Previne spam de requests e melhora performance
 */

import type { Ref } from 'vue'
import { ref, unref, watch } from 'vue'

/**
 * Throttle: Executa a função no máximo uma vez a cada 'delay' ms
 * Útil para eventos contínuos como scroll, resize, mousemove
 */
export function useThrottle<T extends (...args: any[]) => any> (
  fn: T,
  delay = 300,
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn.apply(this, args)
      }, delay - timeSinceLastCall)
    }
  }
}

/**
 * Debounce: Adia a execução até que 'delay' ms passem sem novas chamadas
 * Útil para buscas, validações, auto-save
 */
export function useDebounce<T extends (...args: any[]) => any> (
  fn: T,
  delay = 300,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Debounce para valores reativos (Ref)
 * Retorna um novo Ref que atualiza após o delay
 */
export function useDebouncedRef<T> (
  value: Ref<T> | T,
  delay = 300,
): Ref<T> {
  const debouncedValue = ref(unref(value)) as Ref<T>
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const updateValue = (newValue: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
      timeoutId = null
    }, delay)
  }

  // Se é um Ref, observa mudanças
  if (value !== null && typeof value === 'object' && 'value' in value) {
    const valueRef = value as Ref<T>
    watch(valueRef, newValue => {
      updateValue(newValue)
    })
  } else {
    debouncedValue.value = value as T
  }

  return debouncedValue
}

/**
 * Rate Limiter: Limita número de execuções por período
 * Útil para APIs com rate limits, prevenção de spam
 */
export function useRateLimiter (maxCalls: number, period: number) {
  const calls = ref<number[]>([])

  /**
   * Verifica se pode fazer uma nova chamada
   */
  function canCall (): boolean {
    const now = Date.now()
    // Remove chamadas antigas (fora do período)
    calls.value = calls.value.filter(callTime => now - callTime < period)

    return calls.value.length < maxCalls
  }

  /**
   * Registra uma nova chamada
   */
  function registerCall () {
    calls.value.push(Date.now())
  }

  /**
   * Executa função com rate limiting
   */
  async function execute<T> (fn: () => Promise<T> | T): Promise<T | null> {
    if (!canCall()) {
      console.warn('Rate limit excedido. Tente novamente em alguns instantes.')
      return null
    }

    registerCall()
    return await fn()
  }

  /**
   * Tempo restante até poder fazer nova chamada (ms)
   */
  function getTimeUntilNextCall (): number {
    if (canCall()) {
      return 0
    }

    const now = Date.now()
    const oldestCall = calls.value[0] || now
    const timeSinceOldest = now - oldestCall
    return Math.max(0, period - timeSinceOldest)
  }

  /**
   * Reseta o rate limiter
   */
  function reset () {
    calls.value = []
  }

  return {
    canCall,
    execute,
    getTimeUntilNextCall,
    reset,
    callsRemaining: () => maxCalls - calls.value.length,
  }
}

/**
 * Hook para botões com cooldown
 * Previne spam de cliques
 */
export function useButtonCooldown (cooldownMs = 1000) {
  const isOnCooldown = ref(false)
  const remainingTime = ref(0)
  let intervalId: ReturnType<typeof setInterval> | null = null

  /**
   * Executa ação com cooldown
   */
  async function executeWithCooldown<T> (
    fn: () => Promise<T> | T,
  ): Promise<T | null> {
    if (isOnCooldown.value) {
      return null
    }

    isOnCooldown.value = true
    remainingTime.value = cooldownMs

    // Atualiza o tempo restante a cada 100ms
    intervalId = setInterval(() => {
      remainingTime.value = Math.max(0, remainingTime.value - 100)
      if (remainingTime.value === 0 && intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }, 100)

    try {
      const result = await fn()
      return result
    } finally {
      setTimeout(() => {
        isOnCooldown.value = false
        remainingTime.value = 0
      }, cooldownMs)
    }
  }

  return {
    isOnCooldown,
    remainingTime,
    executeWithCooldown,
  }
}
