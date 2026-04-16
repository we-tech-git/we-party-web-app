<!--
  Componente: SocialAuthButtons.vue
  Descrição: Botões de autenticação social (Google, Facebook, Email)
  OAuth: Google usa SDK nativo com ID Token flow para máxima segurança
-->
<script setup lang="ts">
  import axios from 'axios'
  import { onMounted, ref } from 'vue'
  import { STORAGE_KEYS } from '@/common/storage'
  import { AuthService } from '@/services/auth'
  import { SocialAuthService } from '@/services/socialAuth'

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
    'google-success': [data: any]
    'google-error': [error: any]
  }>()

  const isLoading = ref({
    google: false,
    facebook: false,
  })

  const socialAuthService = new SocialAuthService()
  let googleInitialized = false

  /**
   * Inicializa o Google SDK na montagem do componente
   */
  onMounted(async () => {
    try {
      // Se o SDK já está carregado globalmente, não faz nada
      if (window.google?.accounts?.id) {
        initializeGoogleButton()
        return
      }

      // Aguarda o SDK ser carregado (já deve estar no index.html)
      const googleScriptTimer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(googleScriptTimer)
          initializeGoogleButton()
        }
      }, 100)

      // Timeout após 5s
      setTimeout(() => {
        clearInterval(googleScriptTimer)
        // console.warn('⚠️ Google SDK não carregou no timeout')
      }, 5000)
    } catch (error) {
      console.error('❌ Erro ao inicializar Google SDK:', error)
    }
  })

  /**
   * Inicializa o botão do Google com callback
   * Usa renderButton() para renderizar um botão padrão do Google
   * Evita o One Tap prompt deprecated
   */
  function initializeGoogleButton () {
    if (googleInitialized || !window.google?.accounts?.id) {
      return
    }

    googleInitialized = true
    const clientId = import.meta.env.VITE__GOOGLE_CLIENT_ID

    if (!clientId) {
      // console.warn('⚠️ VITE__GOOGLE_CLIENT_ID não configurado')
      return
    }

    // Inicializa o cliente Google com callback (UMA ÚNICA VEZ)
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
      ux_mode: 'popup', // Usa popup em vez de redirect
    })
  }

  /**
   * Callback recebe a resposta do Google Sign-In
   * @param response - { credential: idToken, select_by: 'user'|'auto' }
   */
  async function handleGoogleCredential (response: any) {
    try {
      isLoading.value.google = true

      if (!response?.credential) {
        throw new Error('Nenhum token recebido do Google')
      }

      // Usa o callback do serviço para processar o token
      const callback = socialAuthService.getGoogleSignInCallback()
      const result = await callback(response)

      // Emite evento de sucesso para o componente pai
      emit('google-success', result)
      emit('google-auth')
    } catch (error: any) {
      console.error('[GOOGLE AUTH] ❌ Erro:', error)
      emit('google-error', error)
    } finally {
      isLoading.value.google = false
    }
  }

  /**
   * 🔐 NOVO: Handler ao clicar no botão do Google
   * Abre o popup de login do Google usando requestCode()
   * Não usa o deprecated One Tap prompt
   */
  async function handleGoogleAuth () {
    if (isLoading.value.google || !googleInitialized) return
    isLoading.value.google = true

    try {
      const clientId = import.meta.env.VITE__GOOGLE_CLIENT_ID
      if (!clientId) {
        throw new Error('Client ID não configurado')
      }

      // Usa requestCode para popup de autenticação
      // Este é o fluxo recomendado pelo Google (não deprecated)
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'profile email', // Scopes que você quer solicitar
        ux_mode: 'popup', // Abre em popup, não redirect
        callback: handleCodeResponse, // Callback quando código é recebido
        // Configurações do popup (altura e largura)
        width: 500, // largura em pixels (padrão: 450-500)
        height: 600, // altura em pixels (padrão: 600-700)
      })

      // Abre o popup
      client.requestCode()
    } catch (error: any) {
      console.error('❌ Erro ao abrir Google Sign-In:', error)
      emit('google-error', { message: error.message })
      isLoading.value.google = false
    }
  }

  /**
   * Callback para quando o código de autorização é recebido
   * Converte o código em ID Token via backend
   */
  async function handleCodeResponse (response: any) {
    try {
      if (!response?.code) {
        throw new Error('Nenhum código recebido do Google')
      }

      // Envia o código para o backend fazer a troca por ID Token
      // O backend usará o Google OAuth library para validar
      const apiBaseUrl = import.meta.env.VITE__BASE_URL || 'http://localhost:8000'
      const endpoint = `${apiBaseUrl}/users/google-auth`

      const axiosResponse = await axios.post(endpoint, { code: response.code })

      if (axiosResponse.data?.success && axiosResponse.data?.data) {
        const result = {
          success: true,
          token: axiosResponse.data.data.token,
          user: axiosResponse.data.data,
          message: axiosResponse.data.message || 'Autenticado com sucesso',
        }

        // Salva dados de autenticação (igual ao fluxo de ID Token)
        if (result.token && result.user) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token)
          localStorage.setItem(STORAGE_KEYS.USER_ID, result.user.id)
          AuthService.saveAuthData({
            success: true,
            message: result.message,
            token: result.token,
            user: result.user,
          })
        }

        // Emite evento de sucesso
        emit('google-success', result)
        emit('google-auth')
      } else {
        throw new Error('Backend retornou erro')
      }
    } catch (error: any) {
      // console.error('[GOOGLE AUTH] ❌ Erro ao processar código:', error)
      emit('google-error', {
        message: error.response?.data?.message || error.message || 'Erro na autenticação',
      })
    } finally {
      isLoading.value.google = false
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
    width: 100%;
    justify-content: center;
}

.social-buttons.compact {
    gap: 0.5rem;
    justify-content: center;
}

/* Botão social base */
.social-btn {
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
    max-width: ;
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
