<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { resetPassword } from '@/api/password'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import InputLabel from '@/components/UI/inputLabel/InputLabel.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const password = ref('')
  const passwordConfirm = ref('')
  const email = ref('')
  const pin = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  onMounted(() => {
    // Se os parâmetros existem na URL, usa eles (comportamento normal)
    if (typeof route.query.email === 'string' && typeof route.query.pin === 'string') {
      email.value = route.query.email
      pin.value = route.query.pin
    } else if (import.meta.env.DEV) {
      // Se estiver em modo de desenvolvimento e os parâmetros não existirem, usa dados de teste
      email.value = 'dev-email@teste.com'
      pin.value = '123456' // PIN de teste
    } else {
      // Se estiver em produção e não houver parâmetros, redireciona
      router.push({ name: '/public/RequestPassword' })
    }
  })

  async function handleReset () {
    if (password.value !== passwordConfirm.value) {
      errorMessage.value = t('resetPassword.errors.passwordMismatch')
      return
    }
    if (password.value.length < 6) {
      errorMessage.value = t('resetPassword.errors.passwordTooShort')
      return
    }

    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      await resetPassword(email.value, pin.value, password.value)
      successMessage.value = t('resetPassword.successMessage')
      setTimeout(() => {
        router.push({ name: '/public/Login' })
      }, 2000)
    } catch (error: any) {
      errorMessage.value = error.response?.data?.message || t('resetPassword.errors.generic')
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <AuthLayout>
    <template #form-content>
      <h1 class="auth-title">{{ t('resetPassword.title') }}</h1>
      <p class="auth-subtitle">{{ t('resetPassword.subtitle') }}</p>

      <form @submit.prevent="handleReset">
        <div class="il-theme--pink">
          <InputLabel v-model="password" :label="t('form.newPassword')" required type="password" />
          <InputLabel v-model="passwordConfirm" :label="t('form.confirmPassword')" required type="password" />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button class="btn-primary" :disabled="isLoading" type="submit">
          <span v-if="isLoading">{{ t('form.loading') }}</span>
          <span v-else>{{ t('resetPassword.button') }}</span>
        </button>
      </form>
    </template>
  </AuthLayout>
</template>

<style scoped>
.btn-primary {
  margin-top: 1.5rem;
}

.il-theme--pink {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
