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
        router.push({ name: 'VerifyPin', query: { email: email.value } })
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
      <h1 class="title">{{ t('forgotPassword.title') }}</h1>
      <p class="subtitle">{{ t('forgotPassword.subtitle') }}</p>

      <form @submit.prevent="handleRequest">
        <InputLabel
          v-model="email"
          :label="t('form.email')"
          placeholder="email@exemplo.com"
          required
          type="email"
        />

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button class="submit-btn" :disabled="isLoading" type="submit">
          <span v-if="isLoading">{{ t('form.loading') }}</span>
          <span v-else>{{ t('forgotPassword.button') }}</span>
        </button>
      </form>
    </template>
  </AuthLayout>
</template>

<style scoped>
.title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.subtitle {
    color: #4B5563;
    margin-bottom: 2rem;
    font-size: 1.1rem;
}

.submit-btn {
    width: 100%;
    padding: 1rem;
    border-radius: 10px;
    border: none;
    font-weight: 700;
    font-size: 1.1rem;
    color: #fff;
    background: linear-gradient(90deg, #FFC25B, #FF5FA6);
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
