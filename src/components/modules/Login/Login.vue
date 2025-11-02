<!--
  Componente: Login.vue
  Descrição: Tela de login do usuário, utiliza AuthLayout e InputLabel.
-->
<script setup lang="ts">
// ===============================
// ESTADO E LÓGICA DO FORMULÁRIO
// ===============================
// Tela de Login – usa AuthLayout e InputLabel
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { loginUser } from '@/api/users'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import InputLabel from '@/components/UI/inputLabel/InputLabel.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import router from '@/router'
  import { AuthService } from '@/services/auth'

  const { t } = useI18n()

  // ===============================
  // GERADOR DE DADOS DE TESTE
  // ===============================
  function generateTestLoginData () {
    // Gera email fixo com número randômico de 3 dígitos
    const randomNumber = Math.floor(Math.random() * 900) + 100
    const emailGenerated = `teste776@gmail.com`
    const passwordGenerated = 'Teste12345@'

    return {
      email: emailGenerated,
      password: passwordGenerated,
    }
  }

  function fillFormWithTestData (showFeedback = false) {
    const testData = generateTestLoginData()

    // Limpa os erros antes de preencher
    resetErrors()

    email.value = testData.email
    password.value = testData.password

    console.log('📝 Dados de teste de login gerados:', {
      email: testData.email,
      senha: testData.password,
    })

    // Feedback visual apenas quando solicitado (regeneração manual)
    if (showFeedback) {
      showSnackbar('✨ Novos dados de teste gerados!', '#22c55e')
    }
  }

  // Estado do formulário de login
  const email = ref('')
  const password = ref('')
  const rememberMe = ref(false)
  const isSubmitting = ref(false)
  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('#ff9800')

  const formErrors = ref({
    email: '',
    password: '',
  })

  // Validação: e-mail + senha preenchidos
  const isFormValid = computed(() => {
    return email.value.trim() && password.value.trim() && email.value.includes('@')
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

  function resetErrors () {
    formErrors.value = {
      email: '',
      password: '',
    }
  }

  async function validateForm () {
    if (isSubmitting.value) return

    resetErrors()

    const missingFields: string[] = []

    if (!email.value.trim()) {
      formErrors.value.email = t('login.errors.required.email')
      missingFields.push('Email')
    } else if (!email.value.includes('@')) {
      formErrors.value.email = t('login.errors.invalid.email')
      showSnackbar('Por favor, insira um email válido')
      return
    }

    if (!password.value.trim()) {
      formErrors.value.password = t('login.errors.required.password')
      missingFields.push('Senha')
    }

    if (missingFields.length > 0) {
      showSnackbar(`Campos obrigatórios: ${missingFields.join(', ')}`)
      return
    }

    await submitForm()
  }

  async function submitForm () {
    if (isSubmitting.value) return

    if (!isFormValid.value) {
      showSnackbar('Por favor, preencha todos os campos obrigatórios')
      return
    }

    const minLoadingMs = 2000
    const start = Date.now()
    isSubmitting.value = true

    try {
      const credentials = {
        email: email.value.trim(),
        password: password.value,
      }

      console.log('Tentativa de login:', { email: credentials.email })

      const response = await loginUser(credentials)
      const data = response.data

      console.log('Resposta do login:', {
        data,
        test: data.success,
        token: data.data.token,
        boolean: (data.success && !!data.data.token),
      })
      // Salvar dados do usuário logado usando AuthService
      if (data.success && !!data.data.token) {
        console.log('Resposta do login 2', data.data)
        AuthService.saveAuthData({
          success: true,
          message: 'Login realizado com sucesso',
          token: data.data.token,
          user: data.data,
        })
      }

      showSnackbar('Login realizado com sucesso! 🎉', '#22c55e')

      setTimeout(() => {
        router.push('/private/feed') // ou rota do dashboard
      }, 1500)
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)

      const errorMessage = error?.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.'
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

  // ===============================
  // INICIALIZAÇÃO DO COMPONENTE
  // ===============================
  onMounted(() => {
    // Preenche automaticamente com dados de teste ao carregar a página
    const testData = generateTestLoginData()

    email.value = testData.email
    password.value = testData.password

    console.log('🚀 Página de login carregada com dados de teste:', {
      email: testData.email,
      senha: testData.password,
    })
  })
</script>

<!--
  ===============================
  TEMPLATE PRINCIPAL
  ===============================
-->
<template>
  <AuthLayout :brand-left="true">
    <template #brand-content>
      <h2 class="brand-title">WE PARTY</h2>
      <i18n-t class="brand-subtitle" keypath="signup.brandSubtitle" tag="p">
        <template #default>
          <br>
          <span class="highlight-text">festa.</span>
        </template>
      </i18n-t>
    </template>

    <template #form-content>
      <h2 class="mobile-brand-title">WE PARTY</h2>
      <div class="title-container">
        <h1 class="text-3xl font-bold">{{ $t('login.title') }}</h1>
        <button
          class="regenerate-btn"
          title="Gerar novos dados de teste"
          type="button"
          @click="() => fillFormWithTestData(true)"
        >
          🎲
        </button>
      </div>

      <form @submit.prevent="validateForm">
        <div class="inputs-container il-theme--pink">
          <InputLabel
            id="email"
            v-model="email"
            :error="!!formErrors.email"
            :label="$t('login.emailPlaceholder')"
            type="email"
            @update:model-value="formErrors.email = ''"
          />
          <span v-if="formErrors.email" class="error-message">{{ formErrors.email }}</span>

          <InputLabel
            id="password"
            v-model="password"
            :error="!!formErrors.password"
            :input-password="true"
            :label="$t('login.passwordPlaceholder')"
            type="password"
            @update:model-value="formErrors.password = ''"
          />
          <span v-if="formErrors.password" class="error-message">{{ formErrors.password }}</span>

          <div class="login-options">
            <label class="remember-me">
              <input v-model="rememberMe" type="checkbox">
              {{ $t('login.rememberMe') }}
            </label>
            <a class="forgot-link" href="#">{{ $t('login.forgotPassword') }}</a>
          </div>

          <button
            :aria-busy="isSubmitting"
            :class="['submit-button', { active: isFormValid, loading: isSubmitting }]"
            :disabled="!isFormValid || isSubmitting"
            type="submit"
          >
            <span v-if="isSubmitting" aria-hidden="true" class="loader" />
            <span>{{ isSubmitting ? 'Entrando...' : $t('login.button') }}</span>
          </button>
        </div>

        <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="4000" />
      </form>

      <div class="footer-row">
        <p class="login-link-text">
          {{ $t('login.noAccount') }} <a href="/public/Signup">{{ $t('login.signupLink') }}</a>
        </p>
        <p class="free-text">É de graça <span class="heart">❤</span></p>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped>
/* Título da marca exibido apenas no mobile */
.mobile-brand-title {
  display: none;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.text-3xl {
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
  background-color: rgba(249, 120, 163, 0.1);
  transform: scale(1.1);
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 4px;
  display: block;
}

/* Tema rosa para InputLabel dentro desta página */
.il-theme--pink {
  --il-border-neutral: #F0F0F0;
  /* neutra */
  --il-border-filled: #FBC0D6;
  /* preenchido rosa claro */
  --il-border-focus: #F978A3;
  /* foco rosa */
  --il-label-active: #F7A4C0;
  /* label ativo rosa suave */
  --il-text: #072961;
  /* texto */
  --il-focus-halo: rgba(249, 120, 163, 0.20);
  /* halo rosa */
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
  color: #F978A3;
  /* Rosa do Figma */
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
  background-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.submit-button.active {
  color: white;
  background: #F978A3;
  /* Rosa principal conforme Figma */
  box-shadow: 0 4px 14px 0 rgba(249, 120, 163, 0.35);
  cursor: pointer;
}

.submit-button.active:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(249, 120, 163, 0.5);
}

.submit-button.loading {
  cursor: wait;
}

.submit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
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

/* Checkbox rosa (suporte nativo com accent-color) */
.remember-me input[type="checkbox"] {
  accent-color: #F978A3;
}

/* Opções (lembrar-me | esqueci) em linha e distantes */
.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.remember-me {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 0.9rem;
}

.forgot-link {
  color: #9ca3af;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* Rodapé com "Não tem conta? Cadastre-se" à esquerda e "É de graça ❤" à direita */
.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 32px;
}

.free-text {
  color: #9ca3af;
}

.heart {
  color: #F978A3;
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

  .title-container {
    justify-content: center;
  }

  .text-3xl {
    text-align: center;
    margin-bottom: 0;
  }

  form {
    margin-top: 0.5rem;
  }
}

@media (max-width: 768px) {
  .title-container {
    justify-content: center;
    gap: 1rem;
  }

  .text-3xl {
    text-align: center;
  }

  .footer-row {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .login-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
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

.graphics-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
