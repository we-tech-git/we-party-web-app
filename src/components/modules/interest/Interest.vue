<!--
  Componente: Interest.vue
  Descrição: Seleção de interesses com busca, sugestões e chips; usa AuthLayout.

-->
<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { getInterests, saveUserInterests } from '@/api/interest'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import { svgIcons } from '@/utils/svgSet'

  const { t } = useI18n()
  const router = useRouter()

  const STORAGE_KEY = 'weparty_selected_interests'

  type InterestOrigin = 'api' | 'static' | 'personal'
  interface IInterest {
    id: string
    name: string
    createdBy?: string
    origin?: InterestOrigin
  }

  const FALLBACK_INTERESTS: IInterest[] = [
    { id: 'static-palestra', name: 'Palestra', origin: 'static' },
    { id: 'static-amapiano', name: 'Amapiano', origin: 'static' },
    { id: 'static-mandelao', name: 'Mandelão', origin: 'static' },
    { id: 'static-reggae', name: 'Reggae', origin: 'static' },
    { id: 'static-anos-90', name: 'Anos 90', origin: 'static' },
    { id: 'static-anos-80', name: 'Anos 80', origin: 'static' },
    { id: 'static-comunitario', name: 'Comunitário', origin: 'static' },
    { id: 'static-pop', name: 'Pop', origin: 'static' },
    { id: 'static-vintage', name: 'Vintage', origin: 'static' },
    { id: 'static-sertanejo', name: 'Sertanejo', origin: 'static' },
    { id: 'static-festival', name: 'Festival', origin: 'static' },
    { id: 'static-standup', name: 'Stand-up', origin: 'static' },
  ]

  const allChips = ref<IInterest[]>([])
  const selected = ref<Set<string>>(new Set())
  const isLoading = ref(false)
  const isFinishing = ref(false)

  const defaultSelectedLabels = new Set(['PALESTRA', 'MANDELÃO'])

  const query = ref('')
  const baseSuggestions = ref<string[]>([
    ...FALLBACK_INTERESTS.map(item => item.name),
    'Dance hall',
    'Feira do Livro',
    'Eventos de SP',
  ])

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

  function persistSelection () {
    const selectionArray = Array.from(selected.value)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectionArray))
  }

  function toggleChip (label: string) {
    const key = label.toUpperCase()
    if (selected.value.has(key)) {
      selected.value.delete(key)
    } else {
      selected.value.add(key)
    }
    selected.value = new Set(selected.value)
    persistSelection()
  }

  async function fetchInterests () {
    try {
      isLoading.value = true
      const response = await getInterests()
      const rawData = Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data

      const payload = Array.isArray(rawData) ? rawData : []

      const normalized = payload.map((item: any) => ({
        id: String(item.id ?? item.uuid ?? item.name ?? crypto.randomUUID()),
        name: String(item.name ?? item.label ?? ''),
        createdBy: item.createdBy ?? '',
        origin: 'api' as InterestOrigin,
      })).filter(chip => chip.name.trim().length > 0)

      allChips.value = normalized.length > 0 ? normalized : [...FALLBACK_INTERESTS]
      applyDefaultSelection()
    } catch (error: any) {
      // Se for um erro de autenticação em modo de desenvolvimento, carrega dados de teste.
      if (error.response?.status === 401 && import.meta.env.DEV) {
        console.warn('MODO DEV: Carregando dados de interesses de teste.')
        const mockInterests = [
          { id: 'mock-1', name: 'Música Pop', origin: 'api' },
          { id: 'mock-2', name: 'Cinema', origin: 'api' },
          { id: 'mock-3', name: 'Viagens', origin: 'api' },
          { id: 'mock-4', name: 'Games', origin: 'api' },
          { id: 'mock-5', name: 'Culinária', origin: 'api' },
          { id: 'mock-6', name: 'Esportes', origin: 'api' },
        ]
        allChips.value = mockInterests
      } else {
        // Em produção, o erro de redirecionamento continua funcionando.
        console.error('Erro ao buscar interesses:', error)
        allChips.value = [...FALLBACK_INTERESTS]
        applyDefaultSelection()
      }
    } finally {
      isLoading.value = false
    }
  }

  function chipClasses (chip: IInterest) {
    const isSelected = selected.value.has(chip.name.toUpperCase())
    return [
      'chip',
      isSelected ? 'selected' : 'idle',
    ]
  }

  function applyDefaultSelection () {
    if (selected.value.size > 0) {
      return
    }

    const defaults = allChips.value.filter(chip => defaultSelectedLabels.has(chip.name.toUpperCase()))
    if (defaults.length === 0) {
      return
    }

    const newSelection = new Set(selected.value)
    for (const chip of defaults) {
      newSelection.add(chip.name.toUpperCase())
    }
    selected.value = newSelection
    // Garante que a seleção padrão também seja salva no localStorage
    persistSelection()
  }

  async function addFromSuggestion (selectedInterest: IInterest) {
    // Apenas alterna o estado local, sem chamar a API
    toggleChip(selectedInterest.name)
  }

  function handleSuggestionClick (label: string) {
    const normalized = label.trim()
    if (!normalized) {
      return
    }

    const existing = allChips.value.find(
      chip => chip.name.toLowerCase() === normalized.toLowerCase(),
    )

    if (existing) {
      addFromSuggestion(existing)
    } else {
      const personalChip: IInterest = {
        id: `personal-${crypto.randomUUID()}`,
        name: normalized,
        origin: 'personal',
      }

      allChips.value = [personalChip, ...allChips.value]
      toggleChip(personalChip.name)
      showModal.value = true
      baseSuggestions.value = Array.from(new Set([
        personalChip.name,
        ...baseSuggestions.value,
      ]))
    }

    query.value = ''
  }

  onMounted(() => {
    // Ao carregar o componente, verifica se há dados no localStorage
    const savedSelection = localStorage.getItem(STORAGE_KEY)
    if (savedSelection) {
      try {
        const parsedSelection = JSON.parse(savedSelection)
        if (Array.isArray(parsedSelection)) {
          selected.value = new Set(parsedSelection)
        }
      } catch (error) {
        console.error('Erro ao carregar interesses do localStorage:', error)
        localStorage.removeItem(STORAGE_KEY) // Limpa dados corrompidos
      }
    }
    fetchInterests()
  })

  const showModal = ref(false)
  async function finish () {
    isFinishing.value = true
    try {
      const selectedNames = Array.from(selected.value)
      if (selectedNames.length > 0) {
        const selectedIds = allChips.value
          .filter(interest => selectedNames.includes(interest.name.toUpperCase()))
          .map(interest => interest.id)

        // Envia todos os IDs para a API de uma só vez
        if (selectedIds.length > 0) {
          await saveUserInterests(selectedIds)
        }
      }

      // Após o sucesso, limpa o localStorage e navega
      localStorage.removeItem(STORAGE_KEY)
      router.push({ name: '/public/AddFriends' })
    } catch (error) {
      console.error('Erro ao salvar interesses:', error)
    } finally {
      isFinishing.value = false
    }
  }
  function closeModal () {
    showModal.value = false
  }
</script>

<template>
  <AuthLayout>
    <template #form-content>
      <h1 class="auth-title">{{ t('interest.title') }}</h1>
      <p class="auth-subtitle">{{ t('interest.subtitle') }}</p>

      <!-- Campo de busca -->
      <div class="search-input-wrapper">
        <svg
          v-if="svgIcons.searchIcon"
          class="search-input-icon"
          fill="currentColor"
          :viewBox="svgIcons.searchIcon.viewBox"
        >
          <path
            v-for="(p, i) in svgIcons.searchIcon.paths"
            :key="i"
            :clip-rule="p.clipRule"
            :d="p.d"
            :fill-rule="p.fillRule"
          />
        </svg>

        <input v-model="query" class="search-input" :placeholder="t('interest.searchPlaceholder')" type="text">
        <button class="filter-btn" type="button">
          <svg
            v-if="svgIcons.filterIcon"
            class="filter-icon"
            fill="none"
            stroke="currentColor"
            :viewBox="svgIcons.filterIcon.viewBox"
          >
            <path
              v-for="(p, i) in svgIcons.filterIcon.paths"
              :key="i"
              :d="p.d"
              :stroke-linecap="p.strokeLinecap ?? 'round'"
              :stroke-linejoin="p.strokeLinejoin ?? 'round'"
              stroke-width="1.8"
            />
          </svg>
        </button>

        <!-- Dropdown de sugestões -->
        <div v-if="showDropdown" class="suggestions">
          <div v-for="(s, idx) in filteredSuggestions" :key="idx" class="suggestion-item">
            <span class="suggestion-label">{{ s }}</span>
            <button class="add-suggestion" type="button" @click="handleSuggestionClick(s)">
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
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner" />
        <p>{{ t('interest.loading') }}</p>
      </div>
      <div v-else class="chips-grid">
        <button
          v-for="chip in allChips"
          :key="chip.id"
          :class="chipClasses(chip)"
          :title="chip.name"
          type="button"
          @click="toggleChip(chip.name)"
        >
          {{ chip.name }}
        </button>
      </div>

      <button class="btn-primary" :disabled="isFinishing || selected.size === 0" type="button" @click="finish">
        <span v-if="isFinishing">Salvando...</span>
        <span v-else>{{ t('interest.finishButton') }}</span>
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
            <button class="btn-primary" type="button" @click="closeModal">
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
.auth-title,
.auth-subtitle {
  text-align: left;
}

/* ===============================
   BUSCA E SUGESTÕES
================================ */
.search-input-wrapper {
  position: relative;
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 1rem 1.75rem 1rem 3.5rem;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 1.1rem;
  color: #1F2937;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
  box-shadow: 0 6px 0 rgba(0, 0, 0, .05);
}

.search-input:focus {
  border-color: #c7c9cf;
  box-shadow: 0 6px 10px rgba(0, 0, 0, .06);
}

.search-input-icon {
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
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
  padding: 1rem 1.25rem;
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
  margin-right: 12px;
  font-size: 1.05rem;
}

.add-suggestion {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  color: #fff;
  display: grid;
  place-items: center;
}

.plus-icon {
  width: 18px;
  height: 18px;
}

/* ===============================
   CHIPS GRID
================================ */
.chips-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 18px;
  margin: 1.75rem auto 2rem;
  max-width: 520px;
  width: 100%;
  justify-content: center;
}

.chip {
  box-sizing: border-box;
  width: 100%;
  height: 54px;
  padding: 0 24px;
  border-radius: 16px;
  border: 2px solid transparent;
  color: #111827;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #FFC25B, #FF5FA6) border-box;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 1rem;
  letter-spacing: .02em;
  text-transform: uppercase;
}

.chip.selected {
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  background-size: 100% 100%;
  color: #fff;
  border: none;
  box-shadow: 0 10px 20px rgba(255, 95, 166, .2);
}

.chip.idle {
  box-shadow: 0 6px 12px rgba(0, 0, 0, .06);
  transition: transform .2s ease, box-shadow .2s ease;
}

.chip.idle:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(255, 95, 166, .2);
}

/* ===============================
   BOTÃO CONCLUIR (GRADIENTE)
================================ */
.btn-primary {
  margin-top: 1rem;
}

.btn-primary:hover {
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
  width: min(620px, 92vw);
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
  font-size: 1.35rem;
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
  padding: 22px 24px;
  color: #4B5563;
  display: grid;
  gap: 14px;
  font-size: 1.05rem;
  line-height: 1.7;
}

.modal-footer {
  padding: 20px 24px 24px;
}

/* ===============================
  BRAND CONTENT (direita)
================================ */
.brand-wrap {
  padding-left: 56px;
  padding-right: 56px;
  margin-top: 72px;
  max-width: 680px;
  font-family: 'Poppins', sans-serif;
}

.brand-title {
  font-family: 'Baloo Thambi 2', cursive;
  font-size: clamp(52px, 4.6vw + 16px, 68px);
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
  margin-top: 28px;
  color: #4B5563;
  font-weight: 600;
  font-size: 1.125rem;
  line-height: 1.7;
  display: grid;
  gap: 14px;
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
    font-size: 2.15rem;
    text-align: center;
  }

  .subtitle {
    text-align: center;
    max-width: 100%;
    margin-bottom: 1.75rem;
  }

  .chips-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 100%;
    gap: 14px;
  }

  .chip {
    height: 46px;
    padding: 0 18px;
    font-size: 1rem;
  }

  .finish-btn {
    padding: 18px;
  }
}

@media (max-width: 480px) {
  .chips-grid {
    /* Garante que os chips possam quebrar em mais linhas se necessário */
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
