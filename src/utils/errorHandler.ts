/**
 * Error Handler Global
 * Sistema centralizado de tratamento e exibição de erros
 */

import { ref } from 'vue'
import { logger } from './logger'

export interface AppError {
  id: string
  message: string
  type: 'error' | 'warning' | 'info' | 'success'
  timestamp: Date
  details?: any
}

// Estado global de erros
const errors = ref<AppError[]>([])
const currentError = ref<AppError | null>(null)

// Callbacks personalizados
let onErrorCallback: ((error: AppError) => void) | null = null

/**
 * Gera um ID único para o erro
 */
function generateErrorId (): string {
  return `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Adiciona um erro ao sistema
 */
function addError (
  message: string,
  type: AppError['type'] = 'error',
  details?: any,
): AppError {
  const error: AppError = {
    id: generateErrorId(),
    message,
    type,
    timestamp: new Date(),
    details,
  }

  errors.value.push(error)
  currentError.value = error

  // Log do erro
  if (type === 'error') {
    logger.error('Error Handler:', message, details)
  } else if (type === 'warning') {
    logger.warn('Warning:', message, details)
  } else {
    logger.log(`[${type.toUpperCase()}]:`, message)
  }

  // Callback personalizado
  if (onErrorCallback) {
    onErrorCallback(error)
  }

  // Auto-remove após 5 segundos se for success ou info
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      removeError(error.id)
    }, 5000)
  }

  return error
}

/**
 * Remove um erro do sistema
 */
function removeError (errorId: string) {
  const index = errors.value.findIndex(e => e.id === errorId)
  if (index !== -1) {
    errors.value.splice(index, 1)
  }
  if (currentError.value?.id === errorId) {
    currentError.value = null
  }
}

/**
 * Limpa todos os erros
 */
function clearErrors () {
  errors.value = []
  currentError.value = null
}

/**
 * Trata erros da API
 */
function handleApiError (error: any, context?: string): AppError {
  let message = 'Ocorreu um erro inesperado'

  if (error.response) {
    // Erro da resposta HTTP
    const status = error.response.status
    const data = error.response.data

    switch (status) {
      case 401: {
        message = 'Sessão expirada. Faça login novamente.'
        break
      }
      case 403: {
        message = 'Você não tem permissão para realizar esta ação.'
        break
      }
      case 404: {
        message = 'Recurso não encontrado.'
        break
      }
      case 422: {
        message = data.message || 'Dados inválidos.'
        break
      }
      default: {
        if (status >= 500) {
          message = 'Erro no servidor. Tente novamente mais tarde.'
        } else if (data?.message) {
          message = data.message
        }
      }
    }
  } else if (error.request) {
    // Erro de rede
    message = 'Erro de conexão. Verifique sua internet.'
  } else if (error.message) {
    message = error.message
  }

  if (context) {
    message = `${context}: ${message}`
  }

  return addError(message, 'error', {
    originalError: error,
    status: error.response?.status,
    context,
  })
}

/**
 * Mensagens de sucesso
 */
function showSuccess (message: string): AppError {
  return addError(message, 'success')
}

/**
 * Mensagens de warning
 */
function showWarning (message: string): AppError {
  return addError(message, 'warning')
}

/**
 * Mensagens informativas
 */
function showInfo (message: string): AppError {
  return addError(message, 'info')
}

/**
 * Registra callback personalizado para erros
 */
function onError (callback: (error: AppError) => void) {
  onErrorCallback = callback
}

/**
 * Hook para componentes Vue
 */
export function useErrorHandler () {
  return {
    // Estado
    errors,
    currentError,

    // Métodos
    addError,
    removeError,
    clearErrors,
    handleApiError,
    showSuccess,
    showWarning,
    showInfo,
    onError,
  }
}

// Export direto para uso no main.ts
export const errorHandler = {
  addError,
  removeError,
  clearErrors,
  handleApiError,
  showSuccess,
  showWarning,
  showInfo,
  onError,
}
