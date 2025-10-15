<!--
  Componente: Interest.vue
  Descrição: Seleção de interesses com busca, sugestões e chips; usa AuthLayout.
  Autor: we-tech-git
  Data: 13/10/2025
-->
<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import { svgIcons } from '@/utils/svgSet'

  const { t } = useI18n()

  const allChips = ref<string[]>([
    'FUNK', 'EVENTOS DE SP', 'DANCE HALL',
    'PALESTRA', 'AMAPIANO', 'MANDELÃO',
    'REGGAE', 'ANOS 90', 'ANOS 80',
    'COMUNITÁRIO', 'POP', 'VINTAGE',
  ])
  const selected = ref<Set<string>>(new Set(['FUNK', 'COMUNITÁRIO']))

  const query = ref('')
  const baseSuggestions = ref<string[]>(['Dance hall', 'Feira do Livro', 'Eventos de SP'])

  const showDropdown = computed(() => query.value.trim().length > 0)
  const filteredSuggestions = computed(() => {
    const q = query.value.trim().toLowerCase()
    const inSelected = (s: string) => selected.value.has(s.toUpperCase())
    const list = baseSuggestions.value.filter(s => s.toLowerCase().includes(q) && !inSelected(s))
    if (q && !list.some(s => s.toLowerCase() === q) && !inSelected(query.value)) {
      return [query.value, ...list]
    }
    return list
  })

  function toggleChip (label: string) {
    const key = label.toUpperCase()
    if (selected.value.has(key)) {
      selected.value.delete(key)
    } else {
      selected.value.add(key)
    }
    selected.value = new Set(selected.value)
  }

  function addFromSuggestion (label: string) {
    const up = label.toUpperCase()
    const isNewInterest = !allChips.value.includes(up)

    if (isNewInterest) allChips.value.unshift(up)
    selected.value.add(up)

    if (isNewInterest) showModal.value = true

    selected.value = new Set(selected.value)
    query.value = ''
  }

  const showModal = ref(false)
  function finish () {
    // Ação de concluir ficará disponível para integração futura
  }
  function closeModal () {
    showModal.value = false
  }
</script>

<template>
  <AuthLayout>
    <template #form-content>
      <h1 class="title">{{ t('interest.title') }}</h1>
      <p class="subtitle">{{ t('interest.subtitle') }}</p>

      <!-- Campo de busca -->
      <div class="search-wrapper">
        <svg v-if="svgIcons.searchIcon" class="search-icon" fill="currentColor" :viewBox="svgIcons.searchIcon.viewBox">
          <path
            v-for="(p, i) in svgIcons.searchIcon.paths"
            :key="i"
            :clip-rule="p.clipRule"
            :d="p.d"
            :fill-rule="p.fillRule"
          />
        </svg>

        <input v-model="query" class="search-input" :placeholder="t('interest.searchPlaceholder')" type="text">

        <!-- Dropdown de sugestões -->
        <div v-if="showDropdown" class="suggestions">
          <div v-for="(s, idx) in filteredSuggestions" :key="idx" class="suggestion-item">
            <span class="suggestion-label">{{ s }}</span>
            <button class="add-suggestion" type="button" @click="addFromSuggestion(s)">
              <svg
                v-if="svgIcons.plusIcon"
                class="plus-icon"
                fill="none"
                stroke="currentColor"
                :viewBox="svgIcons.plusIcon.viewBox"
              >
                <path
                  v-for="(p, i) in svgIcons.plusIcon.paths"
                  :key="i"
                  :d="p.d"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Grid de chips -->
      <div class="chips-grid">
        <button
          v-for="chip in allChips"
          :key="chip"
          :class="['chip', selected.has(chip.toUpperCase()) ? 'selected' : '']"
          :title="chip"
          type="button"
          @click="toggleChip(chip)"
        >
          {{ chip }}
        </button>
      </div>

      <button class="finish-btn" type="button" @click="finish">
        {{ t('interest.finishButton') }}
      </button>

      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('interest.modal.title') }}</h3>
            <button class="modal-close" type="button" @click="closeModal">
              ×
            </button>
          </div>
          <div class="modal-body">
            <p>{{ t('interest.modal.line1') }}</p>
            <p>{{ t('interest.modal.line2') }}</p>
          </div>
          <div class="modal-footer">
            <button class="finish-btn" type="button" @click="closeModal">
              {{ t('interest.finishButton') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template #brand-content>
      <div class="brand-wrap">
        <h2 class="brand-title">
          <span class="line-1">{{ t('interest.brandTitle.part1') }}</span><br>
          <span class="line-2">{{ t('interest.brandTitle.part2') }}</span><span class="qmark">?</span>
        </h2>
        <ul class="benefits">
          <li>• {{ t('interest.benefit1') }}</li>
          <li>• {{ t('interest.benefit2') }}</li>
        </ul>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Baloo+Thambi+2:wght@800&family=Poppins:wght@400;600;700&display=swap');

/* ===============================
   TIPOGRAFIA E TÍTULOS
================================ */
.title {
  font-weight: 700;
  font-size: 2.25rem;
  margin-bottom: .5rem;
}

.subtitle {
  color: #6B7280;
  margin-bottom: 1.25rem;
  max-width: 36ch;
}

/* ===============================
   BUSCA E SUGESTÕES
================================ */
.search-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: .75rem 1.5rem .75rem 3rem;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: .95rem;
  color: #1F2937;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
  box-shadow: 0 4px 0 rgba(0, 0, 0, .05);
}

.search-input:focus {
  border-color: #c7c9cf;
  box-shadow: 0 6px 10px rgba(0, 0, 0, .06);
}

.search-icon {
  position: absolute;
  left: .9rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9CA3AF;
}

.suggestions {
  position: absolute;
  left: 0;
  right: 0;
  margin-top: .5rem;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, .08);
  overflow: hidden;
  z-index: 20;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1rem;
}

.suggestion-item+.suggestion-item {
  border-top: 1px solid #F3F4F6;
}

.suggestion-label {
  color: #111827;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.add-suggestion {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  color: #fff;
  display: grid;
  place-items: center;
}

.plus-icon {
  width: 16px;
  height: 16px;
}

/* ===============================
   CHIPS GRID
================================ */
.chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 1.25rem 0 1.5rem;
}

.chip {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1.5px solid #FF8CB5;
  color: #1F2937;
  background: #fff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.chip.selected {
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  background-size: 100% 100%;
  color: #fff;
  border: none;
  box-shadow: 0 10px 20px rgba(255, 95, 166, .2);
}

.chip:not(.selected) {
  box-shadow: 0 2px 0 rgba(0, 0, 0, .05);
}

/* ===============================
   BOTÃO CONCLUIR (GRADIENTE)
================================ */
.finish-btn {
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  box-shadow: 0 10px 24px rgba(255, 95, 166, .25);
}

.finish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(255, 95, 166, .3);
}

/* ===============================
   MODAL
================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .55);
  display: grid;
  place-items: center;
  z-index: 50;
}

.modal {
  width: min(560px, 92vw);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #F3F4F6;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #E5E7EB;
  background: #fff;
  color: #6B7280;
}

.modal-body {
  padding: 16px 20px;
  color: #4B5563;
  display: grid;
  gap: 10px;
}

.modal-footer {
  padding: 16px 20px 20px;
}

/* ===============================
  BRAND CONTENT (direita)
================================ */
.brand-wrap {
  padding-left: 48px;
  padding-right: 48px;
  margin-top: 64px;
  max-width: 640px;
  font-family: 'Poppins', sans-serif;
}

.brand-title {
  font-family: 'Baloo Thambi 2', cursive;
  font-size: clamp(40px, 4.2vw + 10px, 60px);
  font-weight: 800;
  line-height: 1.05;
  color: #3F3D56;
  text-align: left;
  letter-spacing: -.3px;
}

.brand-title .line-1 {
  white-space: nowrap;
}

.brand-title .line-2 {
  white-space: normal;
}

.brand-title .qmark {
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.benefits {
  margin-top: 20px;
  color: #4B5563;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.6;
  display: grid;
  gap: 12px;
}

.benefits li {
  padding-left: 0;
}

@media (max-width: 960px) {
  .brand-wrap {
    padding: 0 16px;
    margin-top: 0;
    text-align: center;
  }

  .brand-title {
    font-size: clamp(32px, 8vw, 48px);
    text-align: center;
  }

  .benefits {
    justify-items: center;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 1.75rem;
    text-align: center;
  }

  .subtitle {
    text-align: center;
    max-width: 100%;
    margin-bottom: 1.5rem;
  }

  .chips-grid {
    gap: 12px;
    justify-content: center;
  }

  .chip {
    height: 38px;
    padding: 0 14px;
    font-size: 0.875rem;
  }

  .finish-btn {
    padding: 14px;
  }
}

@media (max-width: 480px) {
  .chips-grid {
    /* Garante que os chips possam quebrar em mais linhas se necessário */
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
