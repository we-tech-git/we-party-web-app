<script setup lang="ts">
  import { ref } from 'vue'

  // Extraído de LandingPage.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — primeira
  // fatia da decomposição, escolhida por ser totalmente autocontida (dado,
  // estado e estilo próprios, sem dependência do resto da página).
  //
  // `.section-title`/`.section-description`/`.gradient-text` abaixo são
  // duplicados de propósito de LandingPage.vue: ainda são usados por outras
  // seções que não foram extraídas nesta fatia. Duplicar 3 regras pequenas
  // agora é mais simples e seguro do que criar um componente de heading
  // compartilhado pra um único consumidor (ver seção 2.9 do plano — sem
  // abstração antes da repetição real). Quando uma 2ª seção for extraída,
  // reavaliar a criação de um `LandingSectionHeading`.
  const faqOpen = ref<number | null>(null)

  function toggleFaq (index: number) {
    faqOpen.value = faqOpen.value === index ? null : index
  }

  const faqs = [
    {
      question: 'A We Party é gratuita?',
      answer: 'Sim! Criar uma conta, descobrir eventos e conversar com outras pessoas é 100% gratuito. Alguns eventos parceiros podem cobrar ingresso à parte.',
    },
    {
      question: 'Posso criar eventos na plataforma?',
      answer: 'Claro! Qualquer usuário pode publicar um evento, público ou privado, e convidar sua comunidade em poucos cliques.',
    },
    {
      question: 'Como encontro eventos perto de mim?',
      answer: 'Ative sua localização e o feed mostra automaticamente o que está rolando perto de você, com filtros por categoria, data e distância.',
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Sim. Usamos criptografia nas conversas e nunca compartilhamos seus dados pessoais com terceiros sem sua autorização.',
    },
    {
      question: 'Preciso pagar para participar de eventos?',
      answer: 'Depende do evento. Muitos são gratuitos, e para os pagos você vê o valor e compra o ingresso direto pelo app.',
    },
  ]
</script>

<template>
  <section class="faq faq-v2">
    <div class="faq-bg" />
    <div class="container">
      <div class="faq-grid">
        <div class="faq-intro">
          <h2 class="section-title">Perguntas <span class="gradient-text">frequentes</span></h2>
          <p class="section-description">Toque em uma pergunta para ver a resposta na hora</p>

          <div class="faq-intro-card">
            <div class="faq-chat-avatar faq-intro-avatar"><v-icon color="#fff" icon="mdi-party-popper" size="18" /></div>
            <p class="faq-intro-text">
              <strong>Oi! 👋</strong> Separei as dúvidas que mais chegam por aqui. Bora conferir?
            </p>
          </div>
        </div>

        <div class="faq-chat-list">
          <div v-for="(faq, index) in faqs" :key="faq.question" class="faq-chat-item">
            <div class="faq-chat-question-row">
              <button class="faq-chat-bubble-q" type="button" @click="toggleFaq(index)">
                <span>{{ faq.question }}</span>
                <v-icon class="faq-chat-icon" :class="{ rotated: faqOpen === index }" icon="mdi-chevron-down" size="18" />
              </button>
            </div>
            <Transition name="faq-expand">
              <div v-if="faqOpen === index" class="faq-chat-answer-row">
                <div class="faq-chat-avatar"><v-icon color="#fff" icon="mdi-party-popper" size="18" /></div>
                <div class="faq-chat-bubble-a">{{ faq.answer }}</div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Duplicado de LandingPage.vue — ver comentário no <script>. */
.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1.25rem;
  line-height: 1.3;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  font-size: 1.15rem;
  color: #64748b;
  line-height: 1.75;
  font-weight: 400;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ — BALÕES DE CONVERSA
   ═══════════════════════════════════════════════════════════════════════════ */
.faq-v2 {
  padding: 6rem 0 9rem;
  position: relative;
}

.faq-v2 .container {
  max-width: 1320px;
}

.faq-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 55%);
}

.faq-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 5rem;
  align-items: center;
}

.faq-intro {
  text-align: left;
  max-width: 420px;
}

.faq-intro .section-title {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  margin-bottom: 1rem;
}

.faq-intro .section-description {
  font-size: 1.35rem;
  margin-bottom: 2.25rem;
}

.faq-intro-card {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 4px 22px 22px 22px;
  padding: 1.1rem 1.3rem;
  box-shadow: 0 14px 32px rgba(249, 120, 163, 0.14);
}

.faq-intro-avatar {
  animation: faq-avatar-bounce 3.2s ease-in-out infinite;
}

@keyframes faq-avatar-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.faq-intro-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #4a4a58;
  margin: 0;
}

.faq-intro-text strong {
  color: #1e293b;
}

.faq-chat-list {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.faq-chat-question-row {
  display: flex;
  justify-content: flex-end;
}

.faq-chat-bubble-q {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  border: none;
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 1.1rem;
  padding: 1rem 1.5rem;
  border-radius: 22px 22px 4px 22px;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(255, 95, 143, 0.28);
  max-width: 100%;
  text-align: left;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.faq-chat-bubble-q:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(255, 95, 143, 0.38);
}

.faq-chat-icon {
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.faq-chat-icon.rotated {
  transform: rotate(180deg);
}

.faq-chat-answer-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.faq-chat-avatar {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(249, 120, 163, 0.3);
}

.faq-chat-bubble-a {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #4a4a58;
  font-size: 1.05rem;
  line-height: 1.65;
  padding: 1rem 1.35rem;
  border-radius: 4px 22px 22px 22px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  max-width: 100%;
}

.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 220px;
  overflow: hidden;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Responsivo — movido de LandingPage.vue junto com o resto da seção. */
@media (max-width: 1024px) {
  .faq-grid {
    grid-template-columns: 1fr;
  }

  .faq-intro {
    max-width: 100%;
    text-align: center;
  }

  .faq-intro-card {
    max-width: 480px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .faq-v2 {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }

  .faq-chat-bubble-q,
  .faq-chat-bubble-a {
    max-width: 100%;
  }
}
</style>
