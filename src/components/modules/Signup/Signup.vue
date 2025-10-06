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
        <h1 class="text-3xl font-bold">Cadastro</h1>
        <p class="subtitle">Preencha os dados abaixo para começar.</p>
        <form @submit.prevent="submitForm">
          <div class="inputs-container">
            <div class="input-wrapper">
              <input
                v-model="fullName"
                class="input-field"
                :class="{ 'filled': fullName }"
                placeholder="Nome completo"
                type="text"
              >
            </div>
            <div class="input-wrapper">
              <input
                v-model="email"
                class="input-field"
                :class="{ 'filled': email }"
                placeholder="E-mail"
                type="email"
              >
            </div>
            <div class="input-wrapper">
              <input
                v-model="password"
                class="input-field"
                :class="{ 'filled': password }"
                placeholder="Senha"
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
                >
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" />
                  <path
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <svg
                  v-else
                  class="eye-icon"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div class="input-wrapper">
              <input
                v-model="confirmPassword"
                class="input-field"
                :class="{ 'filled': confirmPassword }"
                placeholder="Confirmar Senha"
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
                >
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" />
                  <path
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <svg
                  v-else
                  class="eye-icon"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p class="login-link-text">
            Já tem uma conta?
            <a href="#">Clique para entrar</a>
          </p>
          <button class="submit-button" :class="{ 'active': isFormValid }" :disabled="!isFormValid" type="submit">
            Concluir cadastro
          </button>
        </form>
      </div>
    </div>

    <div class="brand-section">
      <div class="graphics-container">
        <span class="shape dot-grid top-left" />
        <span class="shape cross top-right" />
        <span class="shape circle middle-left" />
        <span class="shape plus middle-center" />
        <span class="shape circle top-center" />
        <span class="shape cross bottom-left" />
        <span class="shape dot-grid bottom-right" />
        <span class="shape triangle bottom-center" />
      </div>
      <div class="brand-content">
        <h2 class="brand-title">WE PARTY</h2>
        <p class="brand-subtitle">
          Rede social perfeita para sua <span class="highlight-text">festa.</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
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
      }
    },
    computed: {
      isFormValid () {
        // Lógica que verifica se o botão deve ser ativado
        return this.fullName && this.email && this.password && this.password === this.confirmPassword
      },
    },
    methods: {
      submitForm () {
        if (!this.isFormValid) return
        console.log('Formulário enviado!', {
          fullName: this.fullName,
          email: this.email,
          password: this.password,
        })
      },
    },
  }
</script>

<style scoped>
/* ----- FONTES E ESTILOS GLOBAIS ----- */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;700;900&display=swap');

.page-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  font-family: 'Poppins', sans-serif;
}

/* ----- SEÇÃO DO FORMULÁRIO (ESQUERDA) ----- */
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

.input-field {
  width: 100%;
  padding: 16px;
  background-color: #f7f7f7;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  color: #374151;
  transition: all 0.2s;
  font-size: 1rem;
}

.input-field.filled {
  border-color: #FFD3B5;
  color: #212121;
  font-weight: 500;
}

.input-field::placeholder {
  color: #9ca3af;
}

.input-field:focus {
  outline: none;
  border-color: #f97316;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
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

/* ----- SEÇÃO DA MARCA (DIREITA) - ESTILOS CORRIGIDOS ----- */
.brand-section {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 48px;
  /* MUDANÇA: Gradiente exato do Figma */
  background: linear-gradient(142.35deg, rgba(255, 161, 89, 0.466) -1.66%, rgba(255, 99, 159, 0.466) 100.44%);
  overflow: hidden;
}

@media (max-width: 960px) {
  .brand-section {
    display: none;
  }
}

.brand-content {
  position: relative;
  text-align: center;
  z-index: 10;
}

.brand-title {
  font-size: 3.5rem;
  font-weight: 900;
  /* MUDANÇA: Cor do texto principal escura para contraste */
  color: #4B4B4B;
  letter-spacing: 0.1em;
  text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.05);
}

.brand-subtitle {
  font-size: 1.5rem;
  font-weight: 400;
  /* Regular */
  /* MUDANÇA: Cor do subtítulo escura para contraste */
  color: #595959;
  margin-top: 1rem;
  line-height: 1.4;
}

.highlight-text {
  font-weight: 700;
  /* MUDANÇA: Cor de destaque rosa para combinar com o gradiente */
  color: #FF629F;
}

/* ----- ELEMENTOS GRÁFICOS ----- */
.graphics-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.shape {
  position: absolute;
  /* MUDANÇA: Cor dos elementos rosa semi-transparente */
  color: rgba(255, 12, 105, 0.664);
}

.dot-grid {
  width: 50px;
  height: 50px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.dot-grid::before {
  content: '';
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  background-image: radial-gradient(circle, currentColor 4px, transparent 4px);
  background-size: 100% 100%;
}

.dot-grid.top-left {
  top: 15%;
  left: 15%;
}

.dot-grid.bottom-right {
  bottom: 15%;
  right: 15%;
}

.cross::before,
.plus::before {
  content: '+';
  font-size: 1.5rem;
  font-weight: 300;
  display: inline-block;
}

.cross::before {
  transform: rotate(45deg);
}

.cross.top-right {
  top: 12%;
  right: 12%;
}

.cross.bottom-left {
  bottom: 12%;
  left: 10%;
}

.plus.middle-center {
  top: 30%;
  left: 10%;
}

.circle {
  background-color: currentColor;
  border-radius: 50%;
}

.circle.middle-left {
  top: 50%;
  left: 80%;
  width: 15px;
  height: 15px;
  transform: translateY(-50%);
}

.circle.top-center {
  top: 20%;
  right: 35%;
  width: 20px;
  height: 20px;
}

.triangle {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid currentColor;
  transform: rotate(-25deg);
  opacity: 0.8;
}

.triangle.bottom-center {
  bottom: 25%;
  left: 30%;
}
</style>
