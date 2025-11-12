<script setup lang="ts">
// ===============================
// ESTADO E LÓGICA DO FORMULÁRIO
// ===============================
  import confetti from 'canvas-confetti'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { createUser, deleteUser } from '@/api/users'
  import { STORAGE_KEYS } from '@/common/storage'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import router from '@/router'
  import { type StrokeLinecap, type StrokeLinejoin, svgIcons } from '@/utils/svgSet'

  const { t } = useI18n()

  const checkIconViewBox = computed(() => svgIcons.checkIcon?.viewBox || '0 0 12 12')

  const checkIconPaths = computed(() => svgIcons.checkIcon?.paths || [{ d: 'M10 3L4.5 8.5L2 6', strokeLinecap: 'round', strokeLinejoin: 'round' }])

  // ===============================
  // GERADOR DE DADOS DE TESTE
  // ===============================
  function generateRandomUserData () {
    const firstNames = [
      'Ana', 'Bruno', 'Carlos', 'Diana', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
      'Igor', 'Julia', 'Kleber', 'Larissa', 'Marcelo', 'Natália', 'Oscar', 'Patrícia',
      'Rafael', 'Sofia', 'Thiago', 'Valentina', 'Wagner', 'Ximena', 'Yuri', 'Zara',
    ]

    const lastNames = [
      'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
      'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Barbosa', 'Rocha',
      'Almeida', 'Nascimento', 'Araújo', 'Melo', 'Cardoso', 'Ramos', 'Nunes', 'Teixeira',
    ]

    // Gera nome aleatório
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]!
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]!
    const fullNameGenerated = `${firstName} ${lastName}`

    // Gera email fixo com número randômico de 3 dígitos
    const randomNumber = Math.floor(Math.random() * 900) + 100 // Gera número entre 100-999
    const emailGenerated = `teste${randomNumber}@gmail.com`

    // Gera senha que atende aos critérios
    // const emailGenerated = `contact@wepartyapp.com`
    const passwordGenerated = `Teste12345@`

    return {
      fullName: fullNameGenerated,
      email: emailGenerated,
      password: passwordGenerated,
    }
  }

  function fillFormWithTestData (showFeedback = false) {
    const testData = generateRandomUserData()

    // Limpa os erros antes de preencher
    resetErrors()

    fullName.value = testData.fullName
    email.value = testData.email
    password.value = testData.password
    confirmPassword.value = testData.password

    // Atualiza as regras de senha
    updatePasswordRules(testData.password)

    console.log('📝 Dados de teste gerados:', {
      nome: testData.fullName,
      email: testData.email,
      senha: testData.password,
      senhaAtendeCriterios: Object.values(passwordRules.value).every(rule => rule === true),
    })

    // Feedback visual apenas quando solicitado (regeneração manual)
    if (showFeedback) {
      showSnackbar('✨ Novos dados de teste gerados!', '#22c55e')
    }
  }

  const fullName = ref('')
  const email = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const isSubmitting = ref(false)
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
      console.log('Envio de dados do usuário:', userData)

      const response = await createUser(userData)

      console.log('Resposta da API:', response.data)

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
      console.error('Erro ao registrar usuário:', error)

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
  // INICIALIZAÇÃO DO COMPONENTE
  // ===============================
  onMounted(() => {
    // Preenche automaticamente com dados de teste ao carregar a página
    const testData = generateRandomUserData()

    fullName.value = testData.fullName
    email.value = testData.email
    password.value = testData.password
    confirmPassword.value = testData.password

    // Atualiza as regras de senha
    updatePasswordRules(testData.password)

    console.log('🚀 Página carregada com dados de teste:', {
      nome: testData.fullName,
      email: testData.email,
      senha: testData.password,
    })
  })

  function deleteUserTest (e: any) {
    e.preventDefault()
    const resp = deleteUser()
    console.log('deleteUserTest =====>', resp)
  }
</script>

<template>
  <AuthLayout>
    <template #form-content>
      <a class="back-link" href="#">
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
      <div class="title-container">
        <h1 class="text-3xl font-bold">{{ $t('signup.title') }}</h1>
        <button
          class="regenerate-btn"
          title="Gerar novos dados de teste"
          type="button"
          @click="() => fillFormWithTestData(true)"
        >
          🎲
        </button>
      </div>
      <p class="subtitle">{{ $t('signup.subtitle') }}</p>
      <form @submit.prevent="validateForm">
        <div class="inputs-container">
          <button @click="deleteUserTest">delete user test</button>
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
        <p class="login-link-text">
          {{ $t('signup.hasAccount') }}
          <a href="/public/login">{{ $t('signup.loginLink') }}</a>
        </p>
        <button
          :aria-busy="isSubmitting"
          :class="['submit-button', { loading: isSubmitting }]"
          :disabled="isSubmitting"
          type="submit"
        >
          <span v-if="isSubmitting" aria-hidden="true" class="loader" />
          <span>{{ isSubmitting ? 'Enviando...' : $t('signup.button') }}</span>
        </button>
        <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="4000" />
      </form>
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
/* ----- Estilos específicos do Signup ----- */

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

.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.regenerate-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.regenerate-btn:hover {
  opacity: 1;
  background-color: rgba(249, 115, 22, 0.1);
  transform: scale(1.1);
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

.login-link-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 24px;
}

.login-link-text a {
  font-weight: 600;
  color: #f97316;
  text-decoration: none;
}

.login-link-text a:hover {
  text-decoration: underline;
}

.submit-button {
  width: 100%;
  margin-top: 32px;
  padding: 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  border: none;
  color: white;
  background: #FFB37B;
  box-shadow: 0 4px 14px 0 rgba(255, 179, 123, 0.5);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.submit-button.disabled {
  cursor: not-allowed;
  border: none;
  background-color: #e5e7eb;
  color: #9ca3af;
}

.submit-button.loading {
  cursor: wait;
}

.submit-button:disabled {
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

  .back-link {
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
