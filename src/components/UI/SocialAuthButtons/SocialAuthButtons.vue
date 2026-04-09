<!--
  Componente: SocialAuthButtons.vue
  Descrição: Botões de autenticação social (Google, Facebook, Email)
-->
<script setup lang="ts">
  import { ref } from 'vue'

  interface Props {
    mode?: 'login' | 'signup'
    showEmail?: boolean
    compact?: boolean
  }

  const _props = withDefaults(defineProps<Props>(), {
    mode: 'login',
    showEmail: true,
    compact: false,
  })

  const emit = defineEmits<{
    'google-auth': []
    'facebook-auth': []
    'email-auth': []
  }>()

  const isLoading = ref({
    google: false,
    facebook: false,
  })

  async function handleGoogleAuth () {
    if (isLoading.value.google) return
    isLoading.value.google = true

    try {
      emit('google-auth')
    } finally {
      setTimeout(() => {
        isLoading.value.google = false
      }, 1000)
    }
  }

  async function handleFacebookAuth () {
    if (isLoading.value.facebook) return
    isLoading.value.facebook = true

    try {
      emit('facebook-auth')
    } finally {
      setTimeout(() => {
        isLoading.value.facebook = false
      }, 1000)
    }
  }

  function handleEmailAuth () {
    emit('email-auth')
  }
</script>

<template>
  <div class="social-auth-container" :class="{ compact }">
    <!-- Separador com texto -->
    <div v-if="!compact" class="divider-container">
      <div class="divider-line" />
      <span class="divider-text">
        {{ mode === 'login' ? 'Ou entre com' : 'Ou cadastre-se com' }}
      </span>
      <div class="divider-line" />
    </div>

    <!-- Botões sociais -->
    <div class="social-buttons" :class="{ compact }">
      <!-- Google -->
      <button
        class="social-btn google-btn"
        :class="{ loading: isLoading.google, compact }"
        :disabled="isLoading.google"
        type="button"
        @click="handleGoogleAuth"
      >
        <span v-if="!isLoading.google" class="btn-icon">
          <svg height="20" viewBox="0 0 24 24" width="20">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        </span>
        <span v-else class="spinner" />
        <span v-if="!compact" class="btn-text">Google</span>
      </button>

      <!-- Facebook -->
      <button
        class="social-btn facebook-btn"
        :class="{ loading: isLoading.facebook, compact }"
        :disabled="isLoading.facebook"
        type="button"
        @click="handleFacebookAuth"
      >
        <span v-if="!isLoading.facebook" class="btn-icon">
          <svg fill="#1877F2" height="20" viewBox="0 0 24 24" width="20">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
        </span>
        <span v-else class="spinner" />
        <span v-if="!compact" class="btn-text">Facebook</span>
      </button>

      <!-- Email (opcional) -->
      <button
        v-if="showEmail"
        class="social-btn email-btn"
        :class="{ compact }"
        type="button"
        @click="handleEmailAuth"
      >
        <span class="btn-icon">
          <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
            <path
              d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
            />
          </svg>
        </span>
        <span v-if="!compact" class="btn-text">Email</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.social-auth-container {
    width: 100%;
    margin: 1.5rem 0;
}

.social-auth-container.compact {
    margin: 1rem 0;
}

/* Separador */
.divider-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg,
            rgba(255, 154, 181, 0.1) 0%,
            rgba(255, 154, 181, 0.3) 50%,
            rgba(255, 154, 181, 0.1) 100%);
}

.divider-text {
    font-size: 0.875rem;
    color: #6c757d;
    font-weight: 500;
    white-space: nowrap;
}

/* Container dos botões */
.social-buttons {
    display: flex;
    gap: 0.75rem;
    width: 100%;
}

.social-buttons.compact {
    gap: 0.5rem;
    justify-content: center;
}

/* Botão social base */
.social-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: #ffffff;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.social-btn.compact {
    flex: 0 0 auto;
    min-width: 48px;
    padding: 0.75rem;
    border-radius: 50%;
}

.social-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.social-btn:active {
    transform: translateY(0);
}

.social-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Ícone do botão */
.btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.btn-text {
    flex: 1;
    text-align: left;
}

.social-btn.compact .btn-text {
    display: none;
}

/* Estilos específicos dos botões */
.google-btn:hover {
    border-color: #4285F4;
    background: #f8f9ff;
}

.facebook-btn:hover {
    border-color: #1877F2;
    background: #f0f7ff;
}

.email-btn {
    color: #ff5fa6;
}

.email-btn:hover {
    border-color: #ff5fa6;
    background: #fff5f9;
}

/* Spinner de carregamento */
.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top-color: #ff5fa6;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Responsivo */
@media (max-width: 640px) {
    .social-buttons:not(.compact) {
        flex-direction: column;
    }

    .social-btn:not(.compact) {
        width: 100%;
    }

    .btn-text {
        text-align: center;
    }
}

/* Efeito ripple */
.social-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 95, 166, 0.1);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.social-btn:active::before {
    width: 300px;
    height: 300px;
}
</style>
