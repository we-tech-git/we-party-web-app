<script setup lang="ts">
// ===============================
// ESTADO E LÓGICA DO FORMULÁRIO
// ===============================
  import confetti from 'canvas-confetti'
  import { computed, ref, watch } from 'vue'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import { type StrokeLinecap, type StrokeLinejoin, svgIcons } from '@/utils/svgSet'
  const checkIconViewBox = computed(() => svgIcons.checkIcon?.viewBox || '0 0 12 12')
  const checkIconPaths = computed(() => svgIcons.checkIcon?.paths || [{ d: 'M10 3L4.5 8.5L2 6', strokeLinecap: 'round', strokeLinejoin: 'round' }])

  const fullName = ref('')
  const email = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const _showPassword = ref(false)
  const _showConfirmPassword = ref(false)
  const passwordRules = ref({
    hasLowercase: false,
    hasUppercase: false,
    hasTenChars: false,
  })

  const isFormValid = computed(() => {
    const allPasswordRulesMet = Object.values(passwordRules.value).every(rule => rule === true)

    return fullName.value
      && email.value
      && password.value
      && password.value === confirmPassword.value
      && allPasswordRulesMet
  })

  function updatePasswordRules (newValue: string): void {
    passwordRules.value.hasLowercase = /[a-z]/.test(newValue)
    passwordRules.value.hasUppercase = /[A-Z]/.test(newValue)
    passwordRules.value.hasTenChars = newValue.length >= 10
  }

  function submitForm (): void {
    if (!isFormValid.value) return
    console.log('Formulário enviado!', {
      fullName: fullName.value,
      email: email.value,
      password: password.value,
    })

    triggerConfetti()
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
      <h1 class="text-3xl font-bold">{{ $t('signup.title') }}</h1>
      <p class="subtitle">{{ $t('signup.subtitle') }}</p>
      <form @submit.prevent="submitForm">
        <div class="inputs-container">
          <InputLabel id="fullName" v-model="fullName" :label="$t('signup.fullName')" type="text" />
          <InputLabel id="email" v-model="email" :label="$t('signup.email')" type="email" />
          <InputLabel
            id="password"
            v-model="password"
            :input-password="true"
            :label="$t('signup.password')"
            type="password"
          />
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
          </ul>

          <InputLabel
            id="confirmPassword"
            v-model="confirmPassword"
            :input-password="true"
            :label="$t('signup.confirmPassword')"
            type="password"
          />
        </div>
        <p class="login-link-text">
          {{ $t('signup.hasAccount') }}
          <a href="#">{{ $t('signup.loginLink') }}</a>
        </p>
        <button class="submit-button" :class="{ 'active': isFormValid }" :disabled="!isFormValid" type="submit">
          {{ $t('signup.button') }}
        </button>
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

h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
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
  background-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.submit-button.active {
  color: white;
  background: #FFB37B;
  box-shadow: 0 4px 14px 0 rgba(255, 179, 123, 0.5);
  cursor: pointer;
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
