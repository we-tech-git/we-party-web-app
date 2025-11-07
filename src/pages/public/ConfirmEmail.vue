<script setup lang="ts">
// ===============================
// CONFIRMAÇÃO DE EMAIL - PIN
// ===============================
  import confetti from 'canvas-confetti'
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute } from 'vue-router'
  import { reqeustResendPin, reqeustSendPin, requestConfirmEmail } from '@/api/users'
  import { STORAGE_KEYS } from '@/common/storage'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import router from '@/router'
  import { AuthService } from '@/services/auth'
  import { type StrokeLinecap, type StrokeLinejoin, svgIcons } from '@/utils/svgSet'

  const { t } = useI18n()
  const route = useRoute()

  // ===============================
  // ESTADO DO PIN E CONFIRMAÇÃO
  // ===============================

  // Estado dos 6 dígitos do PIN
  const pinDigits = ref(['', '', '', '', '', ''])
  const pinInputs = ref<HTMLInputElement[]>([])

  // Estado do email do usuário (pode vir da URL ou localStorage)
  const userEmail = ref('')

  // Estados do componente
  const isVerifying = ref(false)
  const canResendPin = ref(true)
  const resendCooldown = ref(0)

  // Estados do snackbar
  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('#ff9800')

  // ===============================
  // COMPUTED E FUNÇÕES AUXILIARES
  // ===============================

  const isPinComplete = computed(() => {
    return pinDigits.value.every(digit => digit !== '' && /^\d$/.test(digit))
  })

  const fullPin = computed(() => {
    return pinDigits.value.join('')
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

  // ===============================
  // FUNÇÕES DO PIN
  // ===============================

  function handlePinInput (index: number, event: Event) {
    const target = event.target as HTMLInputElement
    const value = target.value

    // Permite apenas dígitos
    if (!/^\d*$/.test(value)) {
      target.value = pinDigits.value[index] || ''
      return
    }

    // Atualiza o dígito no array
    pinDigits.value[index] = value.slice(-1) // Apenas último dígito

    // Auto-foco para o próximo campo se houver dígito inserido
    if (value && index < 5) {
      const nextInput = pinInputs.value[index + 1]
      if (nextInput) {
        nextInput.focus()
      }
    }

    // Verifica se PIN está completo para auto-submit
    if (isPinComplete.value) {
      setTimeout(() => {
        verifyPin()
      }, 200)
    }
  }

  function handleKeyDown (index: number, event: KeyboardEvent) {
    // Backspace: limpa campo atual e move para anterior
    if (event.key === 'Backspace' && !pinDigits.value[index] && index > 0) {
      const prevInput = pinInputs.value[index - 1]
      if (prevInput) {
        prevInput.focus()
        pinDigits.value[index - 1] = ''
      }
    }

    // Arrow keys para navegação
    if (event.key === 'ArrowLeft' && index > 0) {
      pinInputs.value[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < 5) {
      pinInputs.value[index + 1]?.focus()
    }
  }

  async function verifyPin () {
    if (!isPinComplete.value || isVerifying.value) return

    isVerifying.value = true

    try {
      // Simula API call para verificar PIN
      const response = await reqeustSendPin({
        email: userEmail.value,
        code: fullPin.value,
      })
      console.log({ response })
      const data = response.data

      if (response.status === 200) {
        triggerConfetti()
        showSnackbar(t('confirmEmail.success'), '#22c55e')

        if (data.success && !!data.data.token) {
          AuthService.saveAuthData({
            success: true,
            message: 'Login realizado com sucesso',
            token: data.data.token,
            user: data.data,
          })
        }

        setTimeout(() => {
          router.push('/public/Congratulations')
        }, 1500)
      } else {
        showSnackbar(t('confirmEmail.invalidPin'), '#ef4444')
        clearPin()
      }

      // Mock: PIN válido é "123456"
      // if (fullPin.value === '123456') {
      //   triggerConfetti()
      //   showSnackbar(t('confirmEmail.success'), '#22c55e')

      //   setTimeout(() => {
      //     router.push('/public/Congratulations')
      //   }, 1500)
      // } else {
      //   showSnackbar(t('confirmEmail.invalidPin'), '#ef4444')
      //   clearPin()
      // }
    } catch (error: any) {
      console.error('Erro ao verificar PIN:', error)
      showSnackbar(t('confirmEmail.verifyError'), '#ef4444')
    } finally {
      isVerifying.value = false
    }
  }

  function clearPin () {
    pinDigits.value = ['', '', '', '', '', '']
    pinInputs.value[0]?.focus()
  }

  async function resendPin () {
    if (!canResendPin.value) return

    try {
      // Simula API call para reenviar PIN
      const response = await reqeustResendPin(userEmail.value)
      console.log({ response })

      showSnackbar(t('confirmEmail.pinSent'), '#22c55e')

      // Inicia cooldown de 60 segundos
      canResendPin.value = false
      resendCooldown.value = 60

      const countdown = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0) {
          clearInterval(countdown)
          canResendPin.value = true
        }
      }, 1000)
    } catch (error) {
      console.error('Erro ao reenviar PIN:', error)
      showSnackbar(t('confirmEmail.resendError'), '#ef4444')
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

  // ===============================
  // INICIALIZAÇÃO DO COMPONENTE
  // ===============================
  onMounted(() => {
    // Recupera email da URL ou localStorage
    // const emailFromQuery = route.query.email as string
    const emailFromStorage = localStorage?.getItem(STORAGE_KEYS.NEW_CREATED_USER)

    userEmail.value = JSON.parse(emailFromStorage || '') || 'usuario@exemplo.com'

    // Foca no primeiro input do PIN
    nextTick(() => {
      if (pinInputs.value[0]) {
        pinInputs.value[0].focus()
      }
    })

    resendPin()

    console.log('🚀 Tela de confirmação de email carregada para:', userEmail.value)
  })
</script>

<template>
  <AuthLayout>
    <template #form-content>
      <a class="back-link" href="#" @click="router.back()">
        <svg
          class="back-arrow"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          :viewBox="svgIcons.backArrow ? svgIcons.backArrow.viewBox : '0 0 24 24'"
        >
          <path
            v-for="(path, index) in (svgIcons.backArrow ? svgIcons.backArrow.paths : [{ d: 'M10 19l-7-7m0 0l7-7m-7 7h18', strokeLinecap: 'round', strokeLinejoin: 'round' }])"
            :key="index"
            :d="path.d"
            :stroke-linecap="path.strokeLinecap as StrokeLinecap"
            :stroke-linejoin="path.strokeLinejoin as StrokeLinejoin"
          />
        </svg>
      </a>
      <h2 class="mobile-brand-title">WE PARTY</h2>

      <div class="confirm-email-content">
        <div class="email-icon">
          📧
        </div>
        <h1 class="confirm-title">{{ $t('confirmEmail.title') }}</h1>
        <p class="confirm-subtitle">
          {{ $t('confirmEmail.subtitle') }}
          <br>
          <strong>{{ userEmail }}</strong>
        </p>

        <!-- PIN Input Grid -->
        <div class="pin-container">
          <div class="pin-inputs">
            <input
              v-for="(digit, index) in pinDigits"
              :key="index"
              ref="pinInputs"
              v-model="pinDigits[index]"
              class="pin-input"
              :class="{
                'pin-filled': digit,
                'pin-error': !isPinComplete && pinDigits.some(d => d !== '') && pinDigits.some(d => d === '')
              }"
              inputmode="numeric"
              maxlength="1"
              type="text"
              @input="handlePinInput(index, $event)"
              @keydown="handleKeyDown(index, $event)"
            >
          </div>
          <p class="pin-hint">{{ $t('confirmEmail.pinHint') }}</p>
        </div>

        <!-- Resend Section -->
        <div class="resend-section">
          <p class="resend-text">{{ $t('confirmEmail.didntReceive') }}</p>
          <button
            class="resend-btn"
            :class="{ disabled: !canResendPin }"
            :disabled="!canResendPin"
            type="button"
            @click="resendPin"
          >
            <span v-if="canResendPin">{{ $t('confirmEmail.resend') }}</span>
            <span v-else>{{ $t('confirmEmail.resendIn', { seconds: resendCooldown }) }}</span>
          </button>
        </div>

        <!-- Verify Button -->
        <button
          class="verify-button"
          :class="{
            active: isPinComplete && !isVerifying,
            loading: isVerifying
          }"
          :disabled="!isPinComplete || isVerifying"
          type="button"
          @click="verifyPin"
        >
          <span v-if="isVerifying" aria-hidden="true" class="loader" />
          <span>{{ isVerifying ? $t('confirmEmail.verifying') : $t('confirmEmail.verify') }}</span>
        </button>
      </div>

      <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="4000" />
    </template>

    <template #brand-content>
      <h2 class="brand-title">WE PARTY</h2>
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
/* ----- Estilos específicos da Confirmação de Email ----- */

.mobile-brand-title {
  display: none;
}

.page-container {
  display: flex;
  width: 100vw;
  height: 100vh;
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

.back-link {
  display: inline-flex;
  color: #FFB37B;
  margin-bottom: 48px;
}

.back-arrow {
  width: 32px;
  height: 32px;
}

.confirm-email-content {
  text-align: center;
  width: 100%;
}

.email-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.confirm-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.confirm-subtitle {
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* ----- Estilos do PIN ----- */
.pin-container {
  margin-bottom: 2rem;
}

.pin-inputs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.pin-input {
  width: 50px;
  height: 60px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background-color: #ffffff;
  color: #1f2937;
  transition: all 0.2s ease;
  outline: none;
}

.pin-input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.pin-input.pin-filled {
  border-color: #22c55e;
  background-color: #f0f9ff;
}

.pin-input.pin-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.pin-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
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
  border-color: #FFD3B5;
  color: #212121;
  font-weight: 500;
}

.input-field.filled+label,
.input-wrapper label.active {
  color: #FFB37B;
}

.input-field:focus {
  outline: none;
  border-color: #f97316;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
}

.input-field:focus+label {
  top: 8px;
  font-size: 0.75rem;
  color: #f97316;
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

/* ----- Seção de Reenvio ----- */
.resend-section {
  margin-bottom: 2rem;
}

.resend-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.resend-btn {
  background: none;
  border: none;
  color: #f97316;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.resend-btn:hover:not(.disabled) {
  background-color: rgba(249, 115, 22, 0.1);
}

.resend-btn.disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

/* ----- Botão de Verificação ----- */
.verify-button {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background-color: #e5e7eb;
  color: #9ca3af;
}

.verify-button.active {
  color: white;
  background: #FFB37B;
  box-shadow: 0 4px 14px 0 rgba(255, 179, 123, 0.5);
}

.verify-button.loading {
  cursor: wait;
}

.verify-button:disabled {
  cursor: not-allowed;
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: loader-spin 0.8s linear infinite;
}

@keyframes loader-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
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

  .confirm-title {
    text-align: center;
    margin-bottom: 1rem;
  }

  .confirm-subtitle {
    text-align: center;
  }

  .pin-inputs {
    gap: 8px;
  }

  .pin-input {
    width: 45px;
    height: 55px;
    font-size: 1.25rem;
  }

  .brand-title {
    font-size: 80px;
  }

  .brand-subtitle {
    font-size: 50px;
    line-height: 1.2;
  }

  .back-link {
    margin-bottom: 24px;
  }
}

@media (max-width: 768px) {
  .email-icon {
    font-size: 3rem;
  }

  .confirm-title {
    font-size: 1.5rem;
  }

  .pin-input {
    width: 40px;
    height: 50px;
    font-size: 1.125rem;
  }
}
</style>
