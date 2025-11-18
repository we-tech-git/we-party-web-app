<!--
  Componente: Interest.vue
  Descrição: Seleção de interesses com busca, sugestões e chips; usa AuthLayout.
  Autor: we-tech-git
  Data: 13/10/2025
-->
<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { callApi } from '@/api'
  import { addUserInterest, removeUserInterest, searchInterestsByName } from '@/api/interest'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import { svgIcons } from '@/utils/svgSet'

  const { t } = useI18n()
  const router = useRouter()

  const STORAGE_KEY = 'weparty_selected_interests'

  interface IInterest {
    name: string
    createdBy: string
    id: string
    hasInterest: boolean
  }

  const allChips = ref<IInterest[]>([])
  const selected = ref<Set<string>>(new Set())
  const isLoading = ref(false)
  const isFinishing = ref(false)
  const isSearching = ref(false)

  const query = ref('')
  const searchResults = ref<IInterest[]>([])
  const debounceTimeout = ref<number | null>(null)

  // Computed para mostrar os chips no grid
  const displayedChips = computed(() => {
    // Se não tem query, mostra todos os interesses
    if (query.value.trim().length === 0) {
      return allChips.value
    }

    // Se tem query, mostra os resultados da busca
    return searchResults.value
  })

  const showNoResults = computed(() => {
    return !isSearching.value && query.value.trim().length > 0 && searchResults.value.length === 0
  })

  async function fetchInterests () {
    try {
      isLoading.value = true
      const response = await callApi('GET', '/interest/recommendations', undefined, true)

      allChips.value = response?.data?.data?.interests
    } catch (error) {
      console.error('Erro ao buscar interesses:', error)
      allChips.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function searchInterests (searchQuery: string) {
    if (!searchQuery.trim()) {
      searchResults.value = []
      return
    }

    try {
      isSearching.value = true
      const response = await searchInterestsByName(searchQuery.trim())
      searchResults.value = response?.data?.data?.interests || []
    } catch (error) {
      console.error('Erro ao buscar interesses:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
      isLoading.value = false
    }
  }

  function debouncedSearch (searchQuery: string) {
    // Limpa o timeout anterior
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
    }

    // Se a query estiver vazia, limpa os resultados imediatamente
    if (!searchQuery.trim()) {
      searchResults.value = []
      isLoading.value = false
      isSearching.value = false
      return
    }

    // Define um novo timeout de 500ms
    debounceTimeout.value = setTimeout(() => {
      searchInterests(searchQuery)
    }, 500)
  }

  async function addFromSuggestion (selectedInterest: IInterest) {
    if (selectedInterest.hasInterest) {
      removeUserInterest(selectedInterest.id)
    } else {
      addUserInterest(selectedInterest.id)
    }
    selectedInterest.hasInterest = !selectedInterest.hasInterest
  }

  onMounted(() => {
    fetchInterests()
  })

  // Watch para executar busca com debounce quando query mudar
  watch(query, newQuery => {
    // Só ativa loading se a query não estiver vazia
    if (newQuery.trim().length > 0) {
      isLoading.value = true
    }
    debouncedSearch(newQuery)
  })

  const showModal = ref(false)
  const showRequestModal = ref(false)
  const newInterestName = ref('')
  const isSubmittingRequest = ref(false)
  function finish () {
    isFinishing.value = true
    const interestsToSave = Array.from(selected.value).map(name => {
      const chip = allChips.value.find(c => c.name.toUpperCase() === name)
      return chip ? { id: chip.id, name: chip.name } : null
    }).filter(Boolean)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(interestsToSave))
      router.push({ name: '/private/feed' })
    } catch (error) {
      console.error('Erro ao salvar interesses:', error)
    } finally {
      isFinishing.value = false
    }
  }

  function skipStep () {
    router.push('/private/feed')
  }
  function closeModal () {
    showModal.value = false
  }

  function openRequestModal () {
    newInterestName.value = query.value.trim()
    showRequestModal.value = true
  }

  function closeRequestModal () {
    showRequestModal.value = false
    newInterestName.value = ''
    isSubmittingRequest.value = false
  }

  async function submitNewInterestRequest () {
    if (!newInterestName.value.trim()) return

    try {
      isSubmittingRequest.value = true

      // Aqui você pode fazer a chamada para a API para solicitar o novo interesse
      // Por exemplo: await requestNewInterest(newInterestName.value)

      console.log('Solicitando novo interesse:', newInterestName.value)

      // Simula delay da API
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Fecha o modal e mostra mensagem de sucesso
      closeRequestModal()
      showModal.value = true

      // Limpa a busca
      query.value = ''
    } catch (error) {
      console.error('Erro ao solicitar novo interesse:', error)
    } finally {
      isSubmittingRequest.value = false
    }
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
      </div>

      <!-- Grid de chips -->
      <div v-if="isLoading || isSearching" class="loading-state">
        <div class="loading-spinner" />
        <p>{{ isSearching ? t('interest.searching') : t('interest.loading') }}</p>
      </div>
      <div v-else-if="showNoResults" class="no-results-container">
        <div class="no-results-icon">🔍</div>
        <h3 class="no-results-title">{{ t('interest.noResultsTitle') }}</h3>
        <p class="no-results-text">{{ t('interest.noResultsDescription') }}</p>
        <button class="btn-request-interest" type="button" @click="openRequestModal">
          <svg
            v-if="svgIcons.plusIcon"
            class="plus-icon-btn"
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
          {{ t('interest.requestNewInterest') }}
        </button>
      </div>
      <div v-else class="chips-grid">
        <button
          v-for="chip in displayedChips"
          :key="chip.id"
          :class="['chip', chip.hasInterest ? 'selected' : '']"
          :title="chip.name"
          type="button"
          @click="addFromSuggestion(chip)"
        >
          {{ chip.name }}
        </button>
      </div>

      <button class="btn-primary" type="button" @click="finish">
        <span v-if="isFinishing">Salvando...</span>
        <span v-else>{{ t('interest.finishButton') }}</span>
      </button>
      <div class="skip-container">
        <a class="skip-link" href="#" @click.prevent="skipStep"><span>Pular esta etapa por enquanto</span></a>
      </div>

      <!-- Modal de Confirmação -->
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

      <!-- Modal de Solicitar Novo Interesse -->
      <div v-if="showRequestModal" class="modal-overlay" @click.self="closeRequestModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('interest.requestModal.title') }}</h3>
            <button class="modal-close" type="button" @click="closeRequestModal">
              ×
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-description">{{ t('interest.requestModal.description') }}</p>
            <div class="input-wrapper">
              <label class="input-label" for="newInterest">{{ t('interest.requestModal.label') }}</label>
              <input
                id="newInterest"
                v-model="newInterestName"
                class="modal-input"
                :placeholder="t('interest.requestModal.placeholder')"
                type="text"
                @keyup.enter="submitNewInterestRequest"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn-secondary"
              type="button"
              @click="closeRequestModal"
            >
              {{ t('interest.requestModal.cancel') }}
            </button>
            <button
              class="finish-btn"
              :disabled="!newInterestName.trim() || isSubmittingRequest"
              type="button"
              @click="submitNewInterestRequest"
            >
              <span v-if="isSubmittingRequest">{{ t('interest.requestModal.submitting') }}</span>
              <span v-else>{{ t('interest.requestModal.submit') }}</span>
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

.suggestion-item.searching,
.suggestion-item.no-results {
  justify-content: center;
  color: #6B7280;
  font-weight: 500;
}

.mini-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #E5E7EB;
  border-top-color: #FF5FA6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
   ESTADO DE LOADING
================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #E5E7EB;
  border-top-color: #FF5FA6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ===============================
   MENSAGEM SEM RESULTADOS
================================ */
.no-results-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-results-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 0.5rem;
}

.no-results-text {
  color: #6B7280;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  max-width: 400px;
}

.btn-request-interest {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  box-shadow: 0 4px 12px rgba(255, 95, 166, .25);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-request-interest:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 95, 166, .35);
}

.plus-icon-btn {
  width: 20px;
  height: 20px;
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
.btn-primary {
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  box-shadow: 0 10px 24px rgba(255, 95, 166, .25);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(255, 95, 166, .3);
}

.skip-container {
  margin-top: 1.5rem;
  text-align: center;
}

.skip-link {
  font-weight: 600;
  color: #f97316;
  text-decoration: none;
  transition: color 0.2s ease;
}

.skip-link:hover {
  text-decoration: underline;
}

.skip-link:hover span {
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
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
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-description {
  margin-bottom: 1rem;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.modal-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 1rem;
  color: #1F2937;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.modal-input:focus {
  border-color: #FF5FA6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
}

.finish-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  cursor: pointer;
  transition: all 0.2s;
}

.finish-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.finish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  font-weight: 600;
  color: #6B7280;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
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

  .btn-primary {
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
