<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { verifyPasswordResetPin } from '@/api/password'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import InputLabel from '@/components/UI/inputLabel/InputLabel.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const pin = ref('')
  const email = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')

  onMounted(() => {
    // Se o e-mail existe na URL, usa ele
    if (typeof route.query.email === 'string') {
      email.value = route.query.email
    } else if (import.meta.env.DEV) {
      // Se estiver em modo de desenvolvimento, usa um e-mail de teste
      email.value = 'dev-email@teste.com'
    } else {
      // Se não, redireciona
      router.push({ name: '/public/RequestPassword' })
    }
  })

  async function handleVerify () {
    if (pin.value.length !== 6) {
      errorMessage.value = t('verifyPin.errors.invalidPin')
      return
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      await verifyPasswordResetPin(email.value, pin.value)
      router.push({ name: '/public/ResetPassword', query: { email: email.value, pin: pin.value } })
    } catch (error: any) {
      errorMessage.value = error.response?.data?.message || t('verifyPin.errors.generic')
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <AuthLayout>
    <template #form-content>
      <h1 class="auth-title">{{ t('verifyPin.title') }}</h1>
      <p class="auth-subtitle">{{ t('verifyPin.subtitle', { email }) }}</p>

      <form @submit.prevent="handleVerify">
        <div>
          <InputLabel
            v-model="pin"
            :label="t('form.pin')"
            maxlength="6"
            required
            type="text"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button class="btn-primary" :disabled="isLoading" type="submit">
          <span v-if="isLoading">{{ t('form.loading') }}</span>
          <span v-else>{{ t('verifyPin.button') }}</span>
        </button>
      </form>
    </template>
  </AuthLayout>
</template>

<style scoped>
.btn-primary {
  margin-top: 1.5rem;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  background-color: #f8d7da;
  color: #721c24;
}
</style>
