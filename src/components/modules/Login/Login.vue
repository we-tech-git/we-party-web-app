<!--
  Componente: Login.vue
  Descrição: Tela de login do usuário, utiliza AuthLayout e InputLabel.
-->
<script setup lang="ts">
// ===============================
// ESTADO E LÓGICA DO FORMULÁRIO
// ===============================
// Tela de Login – usa AuthLayout e InputLabel
  import { computed, ref } from 'vue'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import InputLabel from '@/components/UI/inputLabel/InputLabel.vue'

  // Estado do formulário de login
  const email = ref('')
  const password = ref('')
  const rememberMe = ref(false)

  // Validação mínima: e-mail + senha preenchidos
  const isFormValid = computed(() => Boolean(email.value && password.value))

  function submitForm (): void {
    if (!isFormValid.value) return
    // TODO: chamar ação de autenticação aqui
    console.log('Login submit:', { email: email.value, rememberMe: rememberMe.value })
  }
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
      <h1 class="text-3xl font-bold">{{ $t('login.title') }}</h1>

      <form @submit.prevent="submitForm">
        <div class="inputs-container il-theme--pink">
          <InputLabel id="email" v-model="email" :label="$t('login.emailPlaceholder')" type="email" />
          <InputLabel
            id="password"
            v-model="password"
            :input-password="true"
            :label="$t('login.passwordPlaceholder')"
            type="password"
          />

          <div class="login-options">
            <label class="remember-me">
              <input v-model="rememberMe" type="checkbox">
              {{ $t('login.rememberMe') }}
            </label>
            <a class="forgot-link" href="#">{{ $t('login.forgotPassword') }}</a>
          </div>

          <button class="submit-button" :class="{ active: isFormValid }" :disabled="!isFormValid" type="submit">{{
            $t('login.button') }}</button>
        </div>
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
