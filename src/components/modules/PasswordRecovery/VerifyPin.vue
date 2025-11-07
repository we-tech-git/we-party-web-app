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
    if (typeof route.query.email === 'string') {
      email.value = route.query.email
    } else {
      // Se não houver e-mail, volta para a primeira etapa
      router.push({ name: 'RequestPassword' })
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
      router.push({ name: 'ResetPassword', query: { email: email.value, pin: pin.value } })
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
      <h1 class="title">{{ t('verifyPin.title') }}</h1>
      <p class="subtitle">{{ t('verifyPin.subtitle', { email }) }}</p>

      <form @submit.prevent="handleVerify">
        <InputLabel
          v-model="pin"
          :label="t('form.pin')"
          maxlength="6"
          placeholder="123456"
          required
          type="text"
        />

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button class="submit-btn" :disabled="isLoading" type="submit">
          <span v-if="isLoading">{{ t('form.loading') }}</span>
          <span v-else>{{ t('verifyPin.button') }}</span>
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

.error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    text-align: center;
    background-color: #f8d7da;
    color: #721c24;
}
</style>
