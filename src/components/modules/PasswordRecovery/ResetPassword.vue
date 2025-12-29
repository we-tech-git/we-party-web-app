<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { requestSetNewPassord, requestVerifyToken } from '@/api/password'
import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
import InputLabel from '@/components/UI/inputLabel/InputLabel.vue'
import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const password = ref('')
const passwordConfirm = ref('')
const email = ref('')
const token = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const passwordRules = ref({
  hasLowercase: false,
  hasUppercase: false,
  hasTenChars: false,
  hasSpecial: false,
})

const allPasswordRulesMet = computed(() => Object.values(passwordRules.value).every(Boolean))

const snackbarVisible = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('#ff9800')

onMounted(() => {
  // Se os parâmetros existem na URL, usa eles (comportamento normal)
  if (typeof route.query.token === 'string' && typeof route.query.email === 'string') {
    token.value = route.query.token
    email.value = route.query.email
  } else if (import.meta.env.DEV) {
    // Se estiver em modo de desenvolvimento e os parâmetros não existirem, usa dados de teste
    // email.value = 'dev-email@teste.com'
    // pin.value = '123456' // PIN de teste
  } else {
    // Se estiver em produção e não houver parâmetros, redireciona
    // router.push({ name: '/public/RequestPassword' })
  }

  verifyToken()
})

async function handleReset() {
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = t('resetPassword.errors.passwordMismatch')
    return
  }
  if (!allPasswordRulesMet.value) {
    errorMessage.value = t('resetPassword.errors.passwordRules')
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await requestSetNewPassord(token.value, password.value)
    console.log('Resposta da redefinição de senha:', response)
    if (response.data.success) {
      showSnackbar(t('resetPassword.successMessage'), '#4caf50')
      // Redireciona para a página de login após um breve atraso
      setTimeout(() => {
        router.push({ name: '/public/Login' })
      }, 2000)
      return
    }
    // setTimeout(() => {
    //   router.push({ name: '/public/Login' })
    // }, 2000)
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || t('resetPassword.errors.generic')
    showSnackbar(errorMessage, '#f44336')
  } finally {
    isLoading.value = false
  }
}

function showSnackbar(message: string, color = '#ff9800') {
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

async function verifyToken() {
  try {
    const response = await requestVerifyToken(email.value, token.value)
    if (response.data.success) {
      showSnackbar(t('resetPassword.tokenVerified'), '#4caf50')
      return
    }
    throw new Error(t('resetPassword.errors.invalidToken'))
  } catch (error: any) {
    const localErrorMessage = error.response?.data?.message || t('resetPassword.errors.invalidToken')
    errorMessage.value = localErrorMessage
    // Redireciona de volta para a página de solicitação de senha após um breve atraso
    showSnackbar(localErrorMessage, '#f44336')
    setTimeout(() => {
      router.push({ name: '/public/RequestPassword' })
    }, 3000)
  }
}

function updatePasswordRules(newValue: string): void {
  passwordRules.value.hasLowercase = /[a-z]/.test(newValue)
  passwordRules.value.hasUppercase = /[A-Z]/.test(newValue)
  passwordRules.value.hasTenChars = newValue.length >= 10
  passwordRules.value.hasSpecial = /[^A-Za-z0-9]/.test(newValue)
}

watch(password, updatePasswordRules)

</script>

<template>
  <AuthLayout>
    <template #form-content>
      <a class="back-link" href="#" @click.prevent="router.back()">
        <svg class="back-arrow" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
      <h1 class="auth-title">{{ t('resetPassword.title') }}</h1>
      <p class="auth-subtitle">{{ t('resetPassword.subtitle') }}</p>

      <form @submit.prevent="handleReset">
        <div class="form-fields">
          <InputLabel v-model="password" :input-password="true" :label="t('form.newPassword')" required
            type="password" />
          <ul v-if="password.length > 0" class="password-rules-container">
            <li :class="{ completed: passwordRules.hasLowercase }">
              <svg class="check-icon" fill="none" viewBox="0 0 12 12">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
              </svg>
              {{ t('signup.rules.lowercase') }}
            </li>
            <li :class="{ completed: passwordRules.hasUppercase }">
              <svg class="check-icon" fill="none" viewBox="0 0 12 12">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
              </svg>
              {{ t('signup.rules.uppercase') }}
            </li>
            <li :class="{ completed: passwordRules.hasTenChars }">
              <svg class="check-icon" fill="none" viewBox="0 0 12 12">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
              </svg>
              {{ t('signup.rules.minChars') }}
            </li>
            <li :class="{ completed: passwordRules.hasSpecial }">
              <svg class="check-icon" fill="none" viewBox="0 0 12 12">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
              </svg>
              {{ t('signup.rules.specialChar') }}
            </li>
          </ul>
          <InputLabel v-model="passwordConfirm" :input-password="true" :label="t('form.confirmPassword')" required
            type="password" />
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

      <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="4000" />
    </template>

  </AuthLayout>
</template>

<style scoped>
.btn-primary {
  margin-top: 1.5rem;
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

.form-fields {
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

.password-rules-container {
  list-style: none;
  padding: 0;
  margin: -12px 0 12px 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.password-rules-container li {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #9ca3af;
  transition: color 0.3s ease;
}

.password-rules-container li.completed {
  color: #22c55e;
}

.check-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}
</style>
