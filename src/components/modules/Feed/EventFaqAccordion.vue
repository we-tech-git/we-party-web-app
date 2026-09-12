<script setup lang="ts">
  // Extraído de NewEventDetails.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 1ª
  // fatia da decomposição do mega-arquivo. Acordeão de "Perguntas
  // Frequentes" do evento — autocontido: recebe o array cru de FAQs da API
  // e cuida da própria normalização (fallbacks de pergunta/resposta) e do
  // estado de abrir/fechar (seção inteira + cada pergunta individual).
  //
  // `icon`/`gradient` calculados em `normalizedFaqs` não têm nenhum uso no
  // template (nem tinham no arquivo original) — preservados como estavam,
  // não é escopo desta extração remover campos computados sem uso.
  import { computed, ref } from 'vue'

  interface FaqItem {
    icon: string
    question: string
    answer: string
    gradient: string
  }

  const props = defineProps<{
    faqs: FaqItem[]
  }>()

  const openFaqIndex = ref<number | null>(null)
  const showFaqs = ref(false)

  // Gradientes padrão para FAQs (usados quando a API não envia gradient)
  const defaultGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ]

  // Normaliza as FAQs vindas da API com fallbacks seguros
  const normalizedFaqs = computed(() => {
    if (!Array.isArray(props.faqs) || props.faqs.length === 0) {
      return []
    }
    return props.faqs.map((faq, index) => ({
      question: faq.question || 'Pergunta não informada',
      answer: faq.answer || 'Resposta não disponível',
      icon: faq.icon || 'mdi-help-circle-outline',
      gradient: faq.gradient || defaultGradients[index % defaultGradients.length],
    }))
  })

  const hasFaqs = computed(() => normalizedFaqs.value.length > 0)

  function toggleFaq (index: number) {
    openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
</script>

<template>
  <!-- FAQs — só aparece se houver FAQs da API -->
  <div v-if="hasFaqs" class="faq-card">
    <button class="faq-header" @click="showFaqs = !showFaqs">
      <span class="faq-header-icon">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M12 12v4" />
        </svg>
      </span>
      <div class="faq-header-text">
        <span class="faq-header-title">Perguntas Frequentes</span>
        <span class="faq-header-sub">Tire suas dúvidas sobre o evento</span>
      </div>
      <span class="faq-header-badge">{{ normalizedFaqs.length }}</span>
      <span class="faq-header-chevron" :class="{ rotated: showFaqs }">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </button>

    <Transition name="faq-expand">
      <div v-if="showFaqs" class="faq-list">
        <div
          v-for="(faq, index) in normalizedFaqs"
          :key="index"
          class="faq-row"
          :class="{ active: openFaqIndex === index }"
        >
          <button class="faq-row-btn" @click="toggleFaq(index)">
            <span class="faq-row-num">{{ index + 1 }}</span>
            <span class="faq-row-label">{{ faq.question }}</span>
            <span class="faq-row-chevron" :class="{ rotated: openFaqIndex === index }">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
          <Transition name="faq-expand">
            <div v-if="openFaqIndex === index" class="faq-row-answer">
              <span class="faq-answer-tag">R</span>
              <p>{{ faq.answer }}</p>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.faq-card {
    background: #fff;
    border: 1px solid rgba(34, 26, 61, .06);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 6px 20px -12px rgba(123, 38, 96, .3);
}

.faq-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    border: none;
    background: linear-gradient(135deg, #FFF0F6 0%, #FFF8F0 100%);
    cursor: pointer;
    padding: 20px 22px;
    text-align: left;
    transition: background 0.2s;
}

.faq-header:hover {
    background: linear-gradient(135deg, #ffe3ef 0%, #fff1e8 100%);
}

.faq-header-icon {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: linear-gradient(135deg, #ff5f8f 0%, #ff9a4d 100%);
    color: #fff;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(255, 95, 166, .3);
}

.faq-header-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.faq-header-title {
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #221A3D;
}

.faq-header-sub {
    font-size: 0.78rem;
    font-weight: 600;
    color: #9ca3af;
}

.faq-header-badge {
    font-size: 11px;
    font-weight: 800;
    color: #ff5fa6;
    background: #fff0f6;
    border: 1px solid #ffd9e6;
    border-radius: 14px;
    padding: 2px 9px;
    white-space: nowrap;
    flex-shrink: 0;
}

.faq-header-chevron {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255, 95, 166, .12);
    color: #ff5fa6;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    transition: transform 0.25s ease, background 0.2s;
}

.faq-header-chevron.rotated {
    transform: rotate(180deg);
    background: rgba(255, 95, 166, .22);
}

.faq-list {
    display: flex;
    flex-direction: column;
}

.faq-row {
    border-top: 1px solid rgba(34, 26, 61, .05);
    transition: background 0.15s;
}

.faq-row-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 15px 22px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
}

.faq-row-btn:hover {
    background: #FBF7FB;
}

.faq-row.active > .faq-row-btn {
    background: #FBF7FB;
}

.faq-row-num {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: #fff0f6;
    border: 1px solid #ffd9e6;
    color: #ff5fa6;
    font-size: 11px;
    font-weight: 800;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    transition: background 0.2s, color 0.2s;
}

.faq-row.active .faq-row-num {
    background: linear-gradient(135deg, #ff5f8f, #ff9a4d);
    border-color: transparent;
    color: #fff;
}

.faq-row-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: #221A3D;
    line-height: 1.4;
    flex: 1;
}

.faq-row.active .faq-row-label {
    color: #ff5fa6;
}

.faq-row-chevron {
    color: #d1d5db;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    transition: transform 0.25s ease, color 0.2s;
}

.faq-row-chevron.rotated {
    transform: rotate(180deg);
    color: #ff5fa6;
}

.faq-row-answer {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 0 22px 18px 61px;
    background: #FBF7FB;
    border-top: 1px solid rgba(255, 95, 166, .08);
}

.faq-answer-tag {
    width: 22px;
    height: 22px;
    border-radius: 7px;
    background: linear-gradient(135deg, #ff5f8f, #ff9a4d);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    margin-top: 14px;
}

.faq-row-answer p {
    margin: 14px 0 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.65;
    font-weight: 500;
}

/* FAQ Expand Transition */
.faq-expand-enter-active,
.faq-expand-leave-active {
    transition: all 0.3s ease;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
    max-height: 0;
    opacity: 0;
}

.faq-expand-enter-to,
.faq-expand-leave-from {
    max-height: 500px;
    opacity: 1;
}
</style>
