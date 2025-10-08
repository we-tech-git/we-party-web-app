<template>
  <div class="page-container">
    <div class="form-section">
      <div class="form-content">
        <a class="back-link" href="#">
          <svg
            class="back-arrow"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
        <h1 class="text-3xl font-bold">{{ $t('signup.title') }}</h1>
        <p class="subtitle">{{ $t('signup.subtitle') }}</p>
        <form @submit.prevent="submitForm">
          <div class="inputs-container">
            <div class="input-wrapper">
              <label :class="{ 'active': fullName }" for="fullName">{{ $t('signup.fullName') }}</label>
              <input
                id="fullName"
                v-model="fullName"
                class="input-field"
                :class="{ 'filled': fullName }"
                type="text"
              >
            </div>
            <div class="input-wrapper">
              <label :class="{ 'active': email }" for="email">{{ $t('signup.email') }}</label>
              <input
                id="email"
                v-model="email"
                class="input-field"
                :class="{ 'filled': email }"
                type="email"
              >
            </div>
            <div class="input-wrapper">
              <label :class="{ 'active': password }" for="password">{{ $t('signup.password') }}</label>
              <input
                id="password"
                v-model="password"
                class="input-field"
                :class="{ 'filled': password }"
                :type="showPassword ? 'text' : 'password'"
              >
              <button class="eye-button" type="button" @click="showPassword = !showPassword">
                <svg
                  v-if="!showPassword"
                  class="eye-icon"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                ><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <svg
                  v-else
                  class="eye-icon"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                ><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </div>

            <ul v-if="password.length > 0" class="password-rules-container">
              <li :class="{ 'completed': passwordRules.hasLowercase }">
                <svg class="check-icon" fill="none" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                /></svg>
                {{ $t('signup.rules.lowercase') }}
              </li>
              <li :class="{ 'completed': passwordRules.hasUppercase }">
                <svg class="check-icon" fill="none" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                /></svg>
                {{ $t('signup.rules.uppercase') }}
              </li>
              <li :class="{ 'completed': passwordRules.hasTenChars }">
                <svg class="check-icon" fill="none" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                /></svg>
                {{ $t('signup.rules.minChars') }}
              </li>
            </ul>

            <div class="input-wrapper">
              <label :class="{ 'active': confirmPassword }" for="confirmPassword">{{ $t('signup.confirmPassword') }}</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                class="input-field"
                :class="{ 'filled': confirmPassword }"
                :type="showConfirmPassword ? 'text' : 'password'"
              >
              <button class="eye-button" type="button" @click="showConfirmPassword = !showConfirmPassword">
                <svg
                  v-if="!showConfirmPassword"
                  class="eye-icon"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                ><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <svg
                  v-else
                  class="eye-icon"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                ><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </div>
          </div>
          <p class="login-link-text">
            {{ $t('signup.hasAccount') }}
            <a href="#">{{ $t('signup.loginLink') }}</a>
          </p>
          <button class="submit-button" :class="{ 'active': isFormValid }" :disabled="!isFormValid" type="submit">
            {{ $t('signup.button') }}
          </button>
        </form>
      </div>
    </div>
    <div class="brand-section">
      <div class="graphics-container">
        <span class="shape dot-grid dg-1" />
        <span class="shape dot-grid dg-2" />
        <span class="shape circle c-1" />
        <span class="shape circle c-2" />
        <span class="shape circle c-3" />
        <span class="shape circle c-4" />
        <span class="shape cross cr-1" />
        <span class="shape cross cr-2" />
        <span class="shape plus p-1" />
        <span class="shape plus p-2" />
        <span class="shape triangle t-1" />
        <span class="shape triangle t-2" />
        <span class="shape triangle t-3" />
        <span class="shape star star-1" />
        <span class="shape star star-2" />
        <span class="shape star star-3" />
        <span class="shape confetti confetti-1" />
        <span class="shape confetti confetti-2" />
        <span class="shape confetti confetti-3" />
        <span class="shape confetti confetti-4" />
      </div>
      <div class="brand-content">
        <h2 class="brand-title">WE PARTY</h2>
        <i18n-t class="brand-subtitle" keypath="signup.brandSubtitle" tag="p">
          <br>
          <span class="highlight-text">festa.</span>
        </i18n-t>
      </div>
    </div>
  </div>
</template>

<script>
// SCRIPT com Validação Avançada
  import confetti from 'canvas-confetti'

  export default {
    name: 'SignUpPage',
    data () {
      return {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        showPassword: false,
        showConfirmPassword: false,
        passwordRules: {
          hasLowercase: false,
          hasUppercase: false,
          hasTenChars: false,
        },
      }
    },
    computed: {
      isFormValid () {
        const allPasswordRulesMet = Object.values(this.passwordRules).every(rule => rule === true)

        return this.fullName
          && this.email
          && this.password
          && this.password === this.confirmPassword
          && allPasswordRulesMet
      },
    },
    watch: {
      password (newValue) {
        this.passwordRules.hasLowercase = /[a-z]/.test(newValue)
        this.passwordRules.hasUppercase = /[A-Z]/.test(newValue)
        this.passwordRules.hasTenChars = newValue.length >= 10
      },
    },
    methods: {
      submitForm () {
        if (!this.isFormValid) return
        console.log('Formulário enviado!', {
          fullName: this.fullName, email: this.email, password: this.password,
        })

        this.triggerConfetti()
      },
      triggerConfetti () {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#FFC947', '#F978A3', '#FF629F', '#FFFFFF'],
        })
      },
    },
  }
</script>

<style scoped>
/* ----- FONTES E ESTILOS GLOBAIS ----- */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Baloo+Thambi+2:wght@800&display=swap');

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

/* ----- ESTILOS PARA FORMAS DECORATIVAS ----- */
.shape {
  position: absolute;
  color: rgba(255, 98, 159, 0.5);
  opacity: 0.8;
}

.dot-grid {
  width: 40px;
  height: 40px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.dot-grid::before {
  content: '';
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  background-image: radial-gradient(circle, currentColor 3px, transparent 3px);
  background-size: 100% 100%;
}

.dg-1 {
  top: 15%;
  left: 15%;
}

.dg-2 {
  bottom: 15%;
  right: 15%;
}

.circle {
  background-color: currentColor;
  border-radius: 50%;
}

.c-1 {
  width: 15px;
  height: 15px;
  top: 50%;
  left: 80%;
}

.c-2 {
  width: 20px;
  height: 20px;
  top: 20%;
  right: 35%;
}

.c-3 {
  width: 12px;
  height: 12px;
  top: 80%;
  left: 30%;
}

.c-4 {
  width: 25px;
  height: 25px;
  top: 10%;
  left: 40%;
  opacity: 0.5;
}

.cross::before,
.plus::before {
  content: '+';
  font-weight: 300;
  display: inline-block;
}

.cross::before {
  transform: rotate(45deg);
}

.cr-1 {
  font-size: 1.8rem;
  top: 12%;
  right: 12%;
}

.cr-2 {
  font-size: 1.5rem;
  bottom: 12%;
  left: 10%;
}

.p-1 {
  font-size: 2.2rem;
  top: 30%;
  left: 10%;
  opacity: 0.6;
}

.p-2 {
  font-size: 1.6rem;
  bottom: 20%;
  right: 40%;
  transform: rotate(15deg);
}

.triangle {
  width: 0;
  height: 0;
  background-color: transparent;
}

.t-1 {
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid currentColor;
  bottom: 25%;
  left: 30%;
  transform: rotate(-25deg);
}

.t-2 {
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 14px solid currentColor;
  top: 15%;
  left: 60%;
  transform: rotate(15deg);
}

.t-3 {
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 25px solid currentColor;
  bottom: 40%;
  right: 10%;
  transform: rotate(35deg);
  opacity: 0.4;
}

.star::before {
  content: '★';
  font-weight: normal;
}

.star-1 {
  font-size: 80px;
  top: 45%;
  left: 10%;
  transform: rotate(15deg);
  color: rgba(255, 201, 71, 0.6);
}

.star-2 {
  font-size: 45px;
  top: 10%;
  right: 30%;
  transform: rotate(-10deg);
  color: rgba(255, 98, 159, 0.6);
}

.star-3 {
  font-size: 30px;
  bottom: 15%;
  left: 45%;
  color: rgba(255, 201, 71, 0.5);
}

.confetti {
  background-color: currentColor;
}

.confetti-1 {
  width: 15px;
  height: 35px;
  top: 25%;
  left: 25%;
  transform: rotate(45deg);
  color: rgba(249, 120, 163, 0.7);
}

.confetti-2 {
  width: 12px;
  height: 30px;
  bottom: 10%;
  right: 8%;
  transform: rotate(-35deg);
  color: rgba(255, 201, 71, 0.8);
}

.confetti-3 {
  width: 20px;
  height: 45px;
  top: 70%;
  right: 35%;
  transform: rotate(25deg);
  color: rgba(249, 120, 163, 0.5);
}

.confetti-4 {
  width: 10px;
  height: 25px;
  top: 85%;
  left: 10%;
  transform: rotate(55deg);
  color: rgba(255, 201, 71, 0.7);
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
