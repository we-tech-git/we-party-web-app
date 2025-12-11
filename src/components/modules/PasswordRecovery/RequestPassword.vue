<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { requestPasswordReset } from '@/api/password'
  import { STORAGE_KEYS } from '@/common/storage'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import InputLabel from '@/components/UI/inputLabel/InputLabel.vue'

  const { t } = useI18n()
  const router = useRouter()

  const email = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

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

      // successMessage.value = t('forgotPassword.successMessage')
      successMessage.value = response.data.message
      // Aguarda um pouco para o usuário ler a mensagem e então redireciona
      localStorage.setItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL, JSON.stringify(email.value))
      setTimeout(() => {
        router.push({ name: '/public/VerifyPin', query: { email: email.value } })
      }, 2000)
    } catch (error: any) {
      errorMessage.value = error.response?.data?.message || t('forgotPassword.errors.generic')
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <AuthLayout>
    <template #form-content>
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
