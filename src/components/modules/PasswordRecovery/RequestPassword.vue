<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { requestPasswordReset } from '@/api/password'
  import { STORAGE_KEYS } from '@/common/storage'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import InputLabel from '@/components/UI/inputLabel/InputLabel.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'

  const { t } = useI18n()
  const router = useRouter()

  const email = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('#ff9800')

  function showSnackbar (message: string, color = '#ff9800') {
    snackbarMessage.value = message
    snackbarColor.value = color

    if (snackbarVisible.value) {
      snackbarVisible.value = false
      requestAnimationFrame(() => {
        snackbarVisible.value = true
      })
      return
    }

    snackbarVisible.value = true
  }

  async function handleRequest () {
    if (isLoading.value) return

    if (!email.value) {
      errorMessage.value = t('forgotPassword.errors.emailRequired')
      return
    }

    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await requestPasswordReset(email.value)

      const message = response.data.message || t('forgotPassword.successMessage')
      successMessage.value = message
      showSnackbar(message, '#4caf50')
      // Aguarda um pouco para o usuário ler a mensagem e então redireciona
      localStorage.setItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL, JSON.stringify(email.value))
      setTimeout(() => {
        router.push({ name: '/public/VerifyPin', query: { email: email.value } })
      }, 2000)
    } catch (error: any) {
      const localErrorMessage = error.response?.data?.message || t('forgotPassword.errors.generic')
      errorMessage.value = localErrorMessage
      showSnackbar(localErrorMessage, '#f44336')
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <AuthLayout>
    <template #form-content>
      <button class="btn-back" type="button" @click="router.back()">
        <svg
          class="btn-back__arrow"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>Voltar</span>
      </button>
      <h2 class="mobile-brand-title notranslate" translate="no">WE PARTY</h2>
      <h1 class="auth-title">{{ t('forgotPassword.title') }}</h1>
      <p class="auth-subtitle">{{ t('forgotPassword.subtitle') }}</p>

      <form @submit.prevent="handleRequest">
        <div>
          <InputLabel v-model="email" :label="t('form.email')" required type="email" />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button class="btn-primary flex items-center justify-center gap-2" :disabled="isLoading" type="submit">
          <AppLoader v-if="isLoading" size="sm" :text="t('form.loading')" variant="text" />
          <span v-else>{{ t('forgotPassword.button') }}</span>
        </button>

        <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="4000" />
      </form>
    </template>
  </AuthLayout>
</template>

<style scoped>
.mobile-brand-title {
  display: none;
}

.btn-primary {
  margin-top: 1.5rem;
}

:deep(.input-field:focus) {
  border-color: transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%) border-box !important;
  box-shadow: 0 0 0 2px rgba(255, 95, 143, 0.2) !important;
}

:deep(.input-field:focus + label) {
  color: #ff5f8f !important;
}

.error-message,
.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px 10px 12px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%);
  box-shadow: 0 4px 14px rgba(255, 95, 143, 0.28);
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-back:hover {
  transform: translateX(-3px);
  box-shadow: 0 6px 20px rgba(255, 95, 143, 0.42);
}

.btn-back:active {
  transform: translateX(-1px);
}

.btn-back__arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.btn-back:hover .btn-back__arrow {
  transform: translateX(-3px);
}

@media (max-width: 960px) {
  .mobile-brand-title {
    display: block;
    margin-bottom: 0.75rem;
    font-family: 'Baloo Thambi 2', cursive;
    font-weight: 800;
    font-size: 2.75rem;
    line-height: 1.1;
    text-transform: uppercase;
    background: linear-gradient(to right, #ff9a4d, #ff5f8f);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-align: center;
  }
}
</style>
