<script setup lang="ts">
// ===============================
// ESTADO E LÓGICA DO FORMULÁRIO
// ===============================
  import confetti from 'canvas-confetti'
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { createUser } from '@/api/users'
  import { STORAGE_KEYS } from '@/common/storage'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import SocialAuthButtons from '@/components/UI/SocialAuthButtons/SocialAuthButtons.vue'
  import router from '@/router'
  import { socialAuthService } from '@/services/socialAuth'
  import { logger } from '@/utils/logger'
  import { type StrokeLinecap, type StrokeLinejoin, svgIcons } from '@/utils/svgSet'

  const { t } = useI18n()

  const checkIconViewBox = computed(() => svgIcons.checkIcon?.viewBox || '0 0 12 12')

  const checkIconPaths = computed(() => svgIcons.checkIcon?.paths || [{ d: 'M10 3L4.5 8.5L2 6', strokeLinecap: 'round', strokeLinejoin: 'round' }])

  const fullName = ref('')
  const email = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const isSubmitting = ref(false)

  // Aceite de termos
  const acceptedTerms = ref(false)
  const showTermsModal = ref(false)
  const termsModalPdf = ref<'terms' | 'privacy'>('terms')

  function openTermsModal (type: 'terms' | 'privacy') {
    termsModalPdf.value = type
    showTermsModal.value = true
  }
  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('#ff9800')
  const _showPassword = ref(false)
  const _showConfirmPassword = ref(false)
  const passwordRules = ref({
    hasLowercase: false,
    hasUppercase: false,
    hasTenChars: false,
    hasSpecial: false,
  })

  const formErrors = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const isFormValid = computed(() => {
    const allPasswordRulesMet = Object.values(passwordRules.value).every(rule => rule === true)

    return fullName.value
      && email.value
      && password.value
      && password.value === confirmPassword.value
      && allPasswordRulesMet
      && acceptedTerms.value
  })

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

  function updatePasswordRules (newValue: string): void {
    passwordRules.value.hasLowercase = /[a-z]/.test(newValue)
    passwordRules.value.hasUppercase = /[A-Z]/.test(newValue)
    passwordRules.value.hasTenChars = newValue.length >= 10
    passwordRules.value.hasSpecial = /[^A-Za-z0-9]/.test(newValue)
  }

  function resetErrors () {
    formErrors.value = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  }

  async function validateForm () {
    if (isSubmitting.value) return

    resetErrors()

    const missingFields: string[] = []

    if (!fullName.value.trim()) {
      formErrors.value.name = t('signup.errors.required.name')
      missingFields.push(t('signup.fullName'))
    }

    if (!email.value.trim()) {
      formErrors.value.email = t('signup.errors.required.email')
      missingFields.push(t('signup.email'))
    }

    if (!password.value.trim()) {
      formErrors.value.password = t('signup.errors.required.password')
      missingFields.push(t('signup.password'))
    }

    if (!confirmPassword.value.trim()) {
      formErrors.value.confirmPassword = t('signup.errors.required.confirmPassword')
      missingFields.push(t('signup.confirmPassword'))
    }

    if (missingFields.length > 0) {
      const key = missingFields.length > 1 ? 'signup.snackbar.missingFields.multiple' : 'signup.snackbar.missingFields.single'
      showSnackbar(t(key, { fields: missingFields.join(', ') }))
      return
    }

    if (password.value !== confirmPassword.value) {
      formErrors.value.confirmPassword = t('signup.errors.passwordMismatch')
      showSnackbar(t('signup.errors.passwordMismatch'))
      return
    }

    if (!Object.values(passwordRules.value).every(rule => rule === true)) {
      formErrors.value.password = t('signup.errors.passwordRules')
      showSnackbar(t('signup.errors.passwordRules'))
      return
    }

    if (!acceptedTerms.value) {
      showSnackbar('Você precisa aceitar os Termos de Uso para continuar.', '#ef4444')
      return
    }

    await submitForm()
  }

  async function submitForm () {
    if (isSubmitting.value) return

    if (!isFormValid.value) {
      showSnackbar(t('signup.snackbar.invalidForm'))
      return
    }

    const minLoadingMs = 3000
    const start = Date.now()
    isSubmitting.value = true

    try {
      // Prepara os dados no formato esperado pelo novo endpoint
      const parsedEmail = email.value.trim()
      const username = parsedEmail && parsedEmail.includes('@')
        ? parsedEmail.split('@')[0] ?? parsedEmail
        : parsedEmail

      const userData = {
        name: fullName.value,
        username,
        email: email.value,
        phone: '', // pode adicionar campo de telefone futuramente
        password: password.value,
        acceptedTerms: true,
        notificationActive: true,
      }
      logger.log('Envio de dados do usuário:', userData)

      const response = await createUser(userData)

      if (response.status !== 201) {
        throw new Error(`Erro inesperado ao registrar usuário. Status: ${response.status}`)
      }

      triggerConfetti()
      showSnackbar(t('signup.snackbar.success'), '#22c55e')

      localStorage.setItem(STORAGE_KEYS.NEW_CREATED_USER, JSON.stringify(email.value))

      setTimeout(() => {
        router.push('/public/ConfirmEmail')
      }, 1500)
    } catch (error: any) {
      logger.error('Erro ao registrar usuário:', error)

      const errorMessage = error?.response?.data?.message || t('signup.snackbar.failure')
      showSnackbar(errorMessage, '#ef4444')
    } finally {
      const elapsed = Date.now() - start
      const remaining = minLoadingMs - elapsed
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining))
      }
      isSubmitting.value = false
    }
  }

  function triggerConfetti (): void {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#FFC947', '#F978A3', '#FF629F', '#FFFFFF'],
    })
  }

  watch(password, updatePasswordRules)

  // ===============================
  // AUTENTICAÇÃO SOCIAL
  // ===============================
  async function handleGoogleAuth () {
    try {
      showSnackbar('Cadastrando com Google...', '#4285F4')
      const result = await socialAuthService.loginWithGoogle()

      if (result.success) {
        triggerConfetti()
        showSnackbar('Cadastro com Google realizado com sucesso! 🎉', '#22c55e')
        setTimeout(() => {
          router.push('/private/feed')
        }, 1500)
      } else {
        showSnackbar(result.message || 'Erro ao fazer cadastro com Google', '#ef4444')
      }
    } catch (error: any) {
      logger.error('Erro na autenticação Google:', error)
      showSnackbar(error.message || 'Erro ao fazer cadastro com Google', '#ef4444')
    }
  }

  async function handleFacebookAuth () {
    try {
      showSnackbar('Cadastrando com Facebook...', '#1877F2')
      const result = await socialAuthService.loginWithFacebook()

      if (result.success) {
        triggerConfetti()
        showSnackbar('Cadastro com Facebook realizado com sucesso! 🎉', '#22c55e')
        setTimeout(() => {
          router.push('/private/feed')
        }, 1500)
      } else {
        showSnackbar(result.message || 'Erro ao fazer cadastro com Facebook', '#ef4444')
      }
    } catch (error: any) {
      logger.error('Erro na autenticação Facebook:', error)
      showSnackbar(error.message || 'Erro ao fazer cadastro com Facebook', '#ef4444')
    }
  }
</script>

<template>
  <AuthLayout>
    <template #form-content>
      <button class="btn-back" type="button" @click="router.push('/public/login')">
        <svg class="btn-back__arrow" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>Voltar</span>
      </button>
      <h2 class="mobile-brand-title notranslate" translate="no">WE PARTY</h2>
      <h1 class="text-3xl font-bold">{{ $t('signup.title') }}</h1>
      <p class="subtitle">{{ $t('signup.subtitle') }}</p>
      <form @submit.prevent="validateForm">
        <div class="inputs-container">
          <InputLabel
            id="fullName"
            v-model="fullName"
            :error="!!formErrors.name"
            :label="$t('signup.fullName')"
            type="text"
            @update:model-value="formErrors.name = ''"
          />
          <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>
          <InputLabel
            id="email"
            v-model="email"
            :error="!!formErrors.email"
            :label="$t('signup.email')"
            type="email"
            @update:model-value="formErrors.email = ''"
          />
          <span v-if="formErrors.email" class="error-message">{{ formErrors.email }}</span>
          <InputLabel
            id="password"
            v-model="password"
            :error="!!formErrors.password"
            :input-password="true"
            :label="$t('signup.password')"
            type="password"
            @update:model-value="formErrors.password = ''"
          />
          <span v-if="formErrors.password" class="error-message">{{ formErrors.password }}</span>
          <ul v-if="password.length > 0" class="password-rules-container">
            <li :class="{ 'completed': passwordRules.hasLowercase }">
              <svg
                class="check-icon"
                fill="none"
                :viewBox="svgIcons.checkIcon ? svgIcons.checkIcon.viewBox : '0 0 12 12'"
              >
                <path
                  v-for="(path, index) in (svgIcons.checkIcon ? svgIcons.checkIcon.paths : [{ d: 'M10 3L4.5 8.5L2 6', strokeLinecap: 'round', strokeLinejoin: 'round' }])"
                  :key="index"
                  :d="path.d"
                  stroke="currentColor"
                  :stroke-linecap="path.strokeLinecap as StrokeLinecap"
                  :stroke-linejoin="path.strokeLinejoin as StrokeLinejoin"
                  stroke-width="1.5"
                />
              </svg>
              {{ $t('signup.rules.lowercase') }}
            </li>
            <li :class="{ 'completed': passwordRules.hasUppercase }">
              <template v-if="svgIcons.checkIcon">
                <svg class="check-icon" fill="none" :viewBox="svgIcons.checkIcon.viewBox">
                  <path
                    v-for="(path, index) in svgIcons.checkIcon.paths"
                    :key="index"
                    :d="path.d"
                    stroke="currentColor"
                    :stroke-linecap="path.strokeLinecap as StrokeLinecap"
                    :stroke-linejoin="path.strokeLinejoin as StrokeLinejoin"
                    stroke-width="1.5"
                  />
                </svg>
              </template>
              {{ $t('signup.rules.uppercase') }}
            </li>
            <li :class="{ 'completed': passwordRules.hasTenChars }">
              <svg class="check-icon" fill="none" :viewBox="checkIconViewBox">
                <path
                  v-for="(path, index) in checkIconPaths"
                  :key="index"
                  :d="path.d"
                  stroke="currentColor"
                  :stroke-linecap="path.strokeLinecap as StrokeLinecap"
                  :stroke-linejoin="path.strokeLinejoin as StrokeLinejoin"
                  stroke-width="1.5"
                />
              </svg>
              {{ $t('signup.rules.minChars') }}
            </li>
            <li :class="{ 'completed': passwordRules.hasSpecial }">
              <svg class="check-icon" fill="none" :viewBox="checkIconViewBox">
                <path
                  v-for="(path, index) in checkIconPaths"
                  :key="`special-${index}`"
                  :d="path.d"
                  stroke="currentColor"
                  :stroke-linecap="path.strokeLinecap as StrokeLinecap"
                  :stroke-linejoin="path.strokeLinejoin as StrokeLinejoin"
                  stroke-width="1.5"
                />
              </svg>
              {{ $t('signup.rules.specialChar') }}
            </li>
          </ul>

          <InputLabel
            id="confirmPassword"
            v-model="confirmPassword"
            :error="!!formErrors.confirmPassword"
            :input-password="true"
            :label="$t('signup.confirmPassword')"
            type="password"
            @update:model-value="formErrors.confirmPassword = ''"
          />
          <span v-if="formErrors.confirmPassword" class="error-message">{{ formErrors.confirmPassword }}</span>
        </div>

        <!-- Aceite de Termos -->
        <div class="terms-acceptance">
          <label class="terms-checkbox-label">
            <input v-model="acceptedTerms" class="terms-checkbox" type="checkbox">
            <span class="terms-checkbox-custom" :class="{ checked: acceptedTerms }">
              <svg
                v-if="acceptedTerms"
                fill="none"
                height="10"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                width="10"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span class="terms-text">
              Li e aceito os
              <button class="terms-link" type="button" @click.prevent="openTermsModal('terms')">Termos de Uso</button>
              e a
              <button class="terms-link" type="button" @click.prevent="openTermsModal('privacy')">Política de
                Privacidade</button>
            </span>
          </label>
        </div>

        <p class="login-link-text">
          {{ $t('signup.hasAccount') }}
          <a href="/public/login">{{ $t('signup.loginLink') }}</a>
        </p>
        <button :aria-busy="isSubmitting" class="btn-primary flex items-center justify-center gap-2" :disabled="isSubmitting" type="submit">
          <AppLoader v-if="isSubmitting" size="sm" text="Enviando..." variant="text" />
          <span v-else>{{ $t('signup.button') }}</span>
        </button>

        <!-- Botões de autenticação social -->
        <SocialAuthButtons
          mode="signup"
          :show-email="false"
          @facebook-auth="handleFacebookAuth"
          @google-auth="handleGoogleAuth"
        />

        <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="4000" />
      </form>

      <!-- Modal de Termos / Política -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div v-if="showTermsModal" class="terms-modal-overlay" @click.self="showTermsModal = false">
            <div class="terms-modal">
              <div class="terms-modal-header">
                <h3 class="terms-modal-title">
                  {{ termsModalPdf === 'terms' ? 'Termos de Uso' : 'Política de Privacidade' }}
                </h3>
                <button class="terms-modal-close" type="button" @click="showTermsModal = false">
                  <svg
                    fill="none"
                    height="18"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    width="18"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="terms-modal-body">
                <iframe
                  class="terms-pdf-viewer"
                  :src="termsModalPdf === 'terms' ? '/termos-de-uso.pdf' : '/politica-de-privacidade.pdf'"
                  title="Documento legal"
                />
              </div>
              <div class="terms-modal-footer">
                <button
                  class="terms-accept-btn"
                  type="button"
                  @click="() => { acceptedTerms = true; showTermsModal = false }"
                >
                  ✓ Aceitar e continuar
                </button>
                <button class="terms-close-btn" type="button" @click="showTermsModal = false">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>

    <template #brand-content>
      <h2 class="brand-title notranslate" translate="no">WE PARTY</h2>
      <i18n-t class="brand-subtitle" keypath="signup.brandSubtitle" tag="p">
        <template #default>
          <br>
          <span class="highlight-text">festa.</span>
        </template>
      </i18n-t>
    </template>
  </AuthLayout>
</template>

<style scoped>
/* ----- Estilos específicos do Signup ----- */

.mobile-brand-title {
  display: none;
}

.page-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  /* iOS Safari */
  background-color: #ffffffee;
  font-family: 'Poppins', sans-serif;
  overflow: hidden;
}

.form-section {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

@media (max-width: 960px) {
  .form-section {
    width: 100%;
  }
}

.form-content {
  width: 100%;
  max-width: 400px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px 10px 12px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #FFC25B 0%, #FF5FA6 100%);
  box-shadow: 0 4px 14px rgba(255, 95, 166, 0.28);
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 40px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-back:hover {
  transform: translateX(-3px);
  box-shadow: 0 6px 20px rgba(255, 95, 166, 0.42);
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

h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.auth-title {
  margin: 0;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 32px;
}

.inputs-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-wrapper {
  position: relative;
}

.input-wrapper label {
  position: absolute;
  top: 18px;
  left: 16px;
  color: #9ca3af;
  pointer-events: none;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.input-wrapper label.active {
  top: 8px;
  font-size: 0.75rem;
  color: #9ca3af;
}

.input-field {
  width: 100%;
  padding: 24px 16px 8px 16px;
  background-color: #FFFFFF;
  border: 1px solid #F0F0F0;
  border-radius: 12px;
  color: #072961;
  transition: all 0.2s ease-in-out;
  font-size: 1rem;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.04);
}

.input-field.filled {
  border-color: #FBC0D6;
  color: #212121;
  font-weight: 500;
}

.input-field.filled+label,
.input-wrapper label.active {
  color: #F978A3;
}

.input-field:focus {
  outline: none;
  border-color: #F978A3;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(249, 120, 163, 0.2);
}

.input-field:focus+label {
  top: 8px;
  font-size: 0.75rem;
  color: #F978A3;
}

.eye-button {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
}

.eye-icon {
  width: 24px;
  height: 24px;
}

/* ---- Aceite de Termos ---- */
.terms-acceptance {
  margin-top: 16px;
}

.terms-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.terms-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.terms-checkbox-custom {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #d1d5db;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  transition: all 0.2s ease;
}

.terms-checkbox-custom.checked {
  background: linear-gradient(135deg, #F978A3 0%, #f97316 100%);
  border-color: transparent;
  color: #fff;
}

.terms-text {
  font-size: 0.82rem;
  color: #6b7280;
  line-height: 1.5;
}

.terms-link {
  background: none;
  border: none;
  padding: 0;
  color: #f97316;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.2s;
}

.terms-link:hover {
  text-decoration-color: #f97316;
}

/* ---- Modal de Termos ---- */
.terms-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.terms-modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.terms-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.terms-modal-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.terms-modal-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terms-modal-close:hover {
  background: #fee2e2;
  color: #ef4444;
}

.terms-modal-body {
  flex: 1;
  overflow: hidden;
}

.terms-pdf-viewer {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border: none;
}

.terms-modal-footer {
  display: flex;
  gap: 10px;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  justify-content: flex-end;
}

.terms-accept-btn {
  padding: 0.55rem 1.4rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #F978A3 0%, #f97316 100%);
  color: #fff;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terms-accept-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(249, 120, 163, 0.4);
}

.terms-close-btn {
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #F978A3 0%, #f97316 100%);
  color: #fff;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(249, 120, 163, 0.3);
}

.terms-close-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(249, 120, 163, 0.4);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.login-link-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 24px;
  margin-bottom: 24px;
  /* Adicionado espaçamento abaixo */
  text-align: center;
  /* Centralizado para consistência */
}

.login-link-text a {
  font-weight: 600;
  color: #f97316;
  /* Alterado para laranja */
  text-decoration: none;
}

.login-link-text a:hover {
  text-decoration: underline;
}

.submit-button.active:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(255, 179, 123, 0.6);
}

/* ----- SEÇÃO DA MARCA (DIREITA) ----- */
.brand-section {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 48px;
  background: linear-gradient(142.35deg, rgba(252, 149, 89, 0.15) -1.66%, rgba(255, 98, 216, 0.15) 100.44%);
  overflow: hidden;
}

.brand-content {
  position: relative;
  text-align: center;
  z-index: 10;
}

.brand-title {
  font-family: 'Baloo Thambi 2', cursive;
  font-weight: 800;
  font-size: 100px;
  line-height: 1.25;
  letter-spacing: 0;
  background: linear-gradient(to right, #FFC947, #F978A3);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.brand-subtitle {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 65px;
  line-height: 80px;
  letter-spacing: 0.3px;
  color: #595959;
  margin-top: 1rem;
}

.highlight-text {
  font-weight: 700;
  color: #ff6262be;
}

.input-error {
  border: 1px solid #ef4444;
  border-radius: 12px;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 4px;
  display: block;
}

.graphics-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
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

  h1 {
    text-align: center;
    margin-bottom: 1rem;
  }

  .subtitle {
    text-align: center;
  }

  .brand-title {
    font-size: 80px;
  }

  .brand-subtitle {
    font-size: 50px;
    line-height: 1.2;
  }

  .btn-back {
    margin-bottom: 24px;
  }
}

@media (max-width: 768px) {

  h1,
  .subtitle,
  .login-link-text {
    text-align: center;
  }
}
</style>
