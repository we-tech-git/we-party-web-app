<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { requestPasswordReset } from '@/api/password'
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
      await requestPasswordReset(email.value)
      successMessage.value = t('forgotPassword.successMessage')
      // Aguarda um pouco para o usuário ler a mensagem e então redireciona
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
      <h1 class="auth-title">{{ t('forgotPassword.title') }}</h1>
      <p class="auth-subtitle">{{ t('forgotPassword.subtitle') }}</p>

      <form @submit.prevent="handleRequest">
        <div class="il-theme--pink">
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
</style>
