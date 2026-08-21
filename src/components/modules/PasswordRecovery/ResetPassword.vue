<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { requestSetNewPassord, requestVerifyToken } from '@/api/password'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
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

  async function handleReset () {
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

  async function verifyToken () {
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

  function updatePasswordRules (newValue: string): void {
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
      <h1 class="auth-title">{{ t('resetPassword.title') }}</h1>
      <p class="auth-subtitle">{{ t('resetPassword.subtitle') }}</p>

      <form @submit.prevent="handleReset">
        <div class="form-fields">
          <InputLabel
            v-model="password"
            :input-password="true"
            :label="t('form.newPassword')"
            required
            type="password"
          />
          <ul v-if="password.length > 0" class="password-rules-container">
            <li :class="{ completed: passwordRules.hasLowercase }">
              <svg class="check-icon" fill="none" viewBox="0 0 12 12">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                />
              </svg>
              {{ t('signup.rules.lowercase') }}
            </li>
            <li :class="{ completed: passwordRules.hasUppercase }">
              <svg class="check-icon" fill="none" viewBox="0 0 12 12">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                />
              </svg>
              {{ t('signup.rules.uppercase') }}
            </li>
            <li :class="{ completed: passwordRules.hasTenChars }">
              <svg class="check-icon" fill="none" viewBox="0 0 12 12">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                />
              </svg>
              {{ t('signup.rules.minChars') }}
            </li>
            <li :class="{ completed: passwordRules.hasSpecial }">
              <svg class="check-icon" fill="none" viewBox="0 0 12 12">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                />
              </svg>
              {{ t('signup.rules.specialChar') }}
            </li>
          </ul>
          <InputLabel
            v-model="passwordConfirm"
            :input-password="true"
            :label="t('form.confirmPassword')"
            required
            type="password"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button class="btn-primary flex items-center justify-center gap-2" :disabled="isLoading" type="submit">
          <AppLoader v-if="isLoading" size="sm" :text="t('form.loading')" variant="text" />
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

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-fields :deep(.input-field:focus) {
  border-color: transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%) border-box !important;
  box-shadow: 0 0 0 2px rgba(255, 95, 143, 0.2) !important;
}

.form-fields :deep(.input-field:focus + label) {
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
