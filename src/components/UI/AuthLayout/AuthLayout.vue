<script setup lang="ts">
  import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

  defineProps<{
    title?: string // Título opcional para personalizar cada página
    brandLeft?: boolean // Quando true, inverte a ordem para brand à esquerda
  }>()
</script>

<template>
  <div class="page-container" :class="{ reverse: !!$props.brandLeft }">
    <div class="auth-language-switcher">
      <LanguageSwitcher />
    </div>
    <div class="form-section">
      <div class="form-content">
        <slot name="form-content" /> <!-- Slot nomeado para o conteúdo do formulário -->
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
        <slot name="brand-content">
          <h2 class="brand-title">WE PARTY</h2>
          <i18n-t class="brand-subtitle" keypath="signup.brandSubtitle" tag="p">
            <template #default>
              <br>
              <span class="highlight-text">festa.</span>
            </template>
          </i18n-t>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-language-switcher {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 100;
}

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
  overflow-y: auto;
}

@media (max-width: 960px) {
  .page-container {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }

  .form-section {
    width: 100%;
    padding: 80px 24px 48px;
  }

  .brand-section {
    display: none !important;
  }
}

.form-content {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  /* Centraliza o conteúdo do formulário */
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

/* Quando brandLeft for true, invertendo ordem via flex */
.page-container.reverse {
  flex-direction: row-reverse;
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

/* Estilos compartilhados que podem ser usados pelos componentes filhos */
:slotted(.back-link) {
  display: inline-flex;
  color: #FFB37B;
  margin-bottom: 48px;
}

:slotted(.back-arrow) {
  width: 32px;
  height: 32px;
}

:slotted(h1) {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

:slotted(.subtitle) {
  color: #6b7280;
  margin-bottom: 32px;
}

:slotted(.inputs-container) {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
