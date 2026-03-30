<!--
  ErrorBoundary Component
  Captura e trata erros em componentes filhos
  Previne que o app inteiro quebre por causa de um erro em um componente
-->
<script setup lang="ts">
  import { onErrorCaptured, provide, ref } from 'vue'
  import { useErrorHandler } from '@/utils/errorHandler'
  import { logger } from '@/utils/logger'

  defineProps<{
    fallback?: string
    showDetails?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'error', error: Error, info: string): void
  }>()

  const { handleApiError } = useErrorHandler()
  const hasError = ref(false)
  const errorMessage = ref('')
  const errorDetails = ref('')
  const errorStack = ref('')

  // Captura erros de componentes filhos
  onErrorCaptured((err: Error, instance, info) => {
    hasError.value = true
    errorMessage.value = err.message || 'Erro desconhecido'
    errorDetails.value = info
    errorStack.value = err.stack || ''

    // Log do erro
    logger.error('ErrorBoundary capturou erro:', {
      message: err.message,
      info,
      stack: err.stack,
      component: instance?.$options?.name || 'Unknown',
    })

    // Emite evento para o pai
    emit('error', err, info)

    // Registra no error handler global
    handleApiError(err, `Erro no componente: ${instance?.$options?.name || 'Unknown'}`)

    // Retorna false para parar a propagação do erro
    return false
  })

  // Provê método para resetar o erro
  provide('resetError', () => {
    hasError.value = false
    errorMessage.value = ''
    errorDetails.value = ''
    errorStack.value = ''
  })

  function retry () {
    hasError.value = false
    errorMessage.value = ''
    errorDetails.value = ''
    errorStack.value = ''
  }
</script>

<template>
  <div class="error-boundary">
    <!-- Exibe conteúdo normal se não há erro -->
    <slot v-if="!hasError" />

    <!-- Exibe fallback se houver erro -->
    <div v-else class="error-fallback">
      <div class="error-content">
        <div class="error-icon">
          <svg
            fill="none"
            height="48"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="48"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>

        <h2 class="error-title">
          {{ fallback || 'Algo deu errado' }}
        </h2>

        <p class="error-message">
          {{ errorMessage }}
        </p>

        <div v-if="showDetails && errorDetails" class="error-details">
          <details>
            <summary>Detalhes técnicos</summary>
            <div class="error-info">
              <p><strong>Info:</strong> {{ errorDetails }}</p>
              <pre v-if="errorStack">{{ errorStack }}</pre>
            </div>
          </details>
        </div>

        <div class="error-actions">
          <button class="btn-retry" type="button" @click="retry">
            <svg
              fill="none"
              height="18"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="18"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Tentar Novamente
          </button>
          <button class="btn-home" type="button" @click="$router.push('/')">
            Voltar para Início
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-boundary {
  display: contents;
}

.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  background: linear-gradient(135deg, #fef5f5 0%, #fff5f7 100%);
  border-radius: 16px;
  margin: 1rem 0;
}

.error-content {
  max-width: 500px;
  text-align: center;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.error-icon svg {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-10px);
  }

  75% {
    transform: translateX(10px);
  }
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 2rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.error-details summary:hover {
  color: #6b7280;
}

.error-info {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: #4b5563;
}

.error-info pre {
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.4;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-retry,
.btn-home {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-retry {
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.btn-home {
  background: #f3f4f6;
  color: #4b5563;
}

.btn-home:hover {
  background: #e5e7eb;
  color: #1f2937;
}

@media (max-width: 640px) {
  .error-fallback {
    min-height: 300px;
    padding: 1.5rem;
  }

  .error-title {
    font-size: 1.25rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .btn-retry,
  .btn-home {
    width: 100%;
    justify-content: center;
  }
}
</style>
