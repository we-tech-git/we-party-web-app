<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { requestPasswordReset } from '@/api/password'
  import { STORAGE_KEYS } from '@/common/storage'
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
      <a class="back-link" href="#" @click.prevent="router.back()">
        <svg
          class="back-arrow"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
        >
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
      <h2 class="mobile-brand-title">WE PARTY</h2>
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

        <button class="btn-primary" :disabled="isLoading" type="submit">
          <span v-if="isLoading">{{ t('form.loading') }}</span>
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

.back-link {
  display: inline-flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  color: #FFB37B;
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: #FF9A44;
}

.back-arrow {
  width: 32px;
  height: 32px;
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
    background: linear-gradient(to right, #FFC947, #F978A3);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-align: center;
  }
}
</style>
