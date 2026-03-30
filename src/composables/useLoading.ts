/**
 * useLoading Composable
 * Gerencia estados de loading globais e locais
 * Permite controle centralizado de carregamento em toda a aplicacao
 */

import { computed, ref } from 'vue'

// Estado global de loading
const globalLoading = ref(false)
const loadingStack = ref<string[]>([])

export function useLoading () {
  /**
   * Ativa o loading global
   * @param key - Identificador unico para o loading (opcional)
   */
  function startLoading (key?: string) {
    if (key) {
      const alreadyExists = loadingStack.value.includes(key)
      if (!alreadyExists) {
        loadingStack.value.push(key)
      }
    }
    globalLoading.value = true
  }

  /**
   * Desativa o loading global
   * @param key - Identificador unico para o loading (opcional)
   */
  function stopLoading (key?: string) {
    if (key) {
      const index = loadingStack.value.indexOf(key)
      if (index !== -1) {
        loadingStack.value.splice(index, 1)
      }
      // So para o loading global se nao ha mais items na stack
      if (loadingStack.value.length === 0) {
        globalLoading.value = false
      }
    } else {
      globalLoading.value = false
      loadingStack.value = []
    }
  }

  /**
   * Executa uma funcao async com loading automatico
   * @param fn - Funcao async a ser executada
   * @param key - Identificador unico (opcional)
   * @param minDuration - Duracao minima do loading em ms (opcional)
   */
  async function withLoading<T> (
    fn: () => Promise<T>,
    key?: string,
    minDuration?: number,
  ): Promise<T> {
    const start = Date.now()
    startLoading(key)

    try {
      const result = await fn()

      // Garante duracao minima se especificada
      if (minDuration) {
        const elapsed = Date.now() - start
        const remaining = minDuration - elapsed
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining))
        }
      }

      return result
    } finally {
      stopLoading(key)
    }
  }

  /**
   * Verifica se um loading especifico esta ativo
   * @param key - Identificador unico
   */
  function isLoading (key: string): boolean {
    return loadingStack.value.includes(key)
  }

  /**
   * Verifica se ha algum loading ativo
   */
  const hasActiveLoading = computed(() => loadingStack.value.length > 0)

  /**
   * Retorna o numero de loadings ativos
   */
  const loadingCount = computed(() => loadingStack.value.length)

  return {
    // Estado
    globalLoading: computed(() => globalLoading.value),
    hasActiveLoading,
    loadingCount,

    // Metodos
    startLoading,
    stopLoading,
    withLoading,
    isLoading,
  }
}
