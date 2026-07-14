<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'

  import { isRequestCanceled, unwrapList } from '@/api'
  import { searchByEvents, searchPublicEvents } from '@/api/event'
  import { useGuestMode } from '@/composables/useGuestMode'
  import { SEARCH_DEBOUNCE_MS } from '@/constants/timing'
  import { logger } from '@/utils/logger'

  interface Props {
    modelValue?: string
    placeholder?: string
    guestMode?: boolean
  }

  interface EventSuggestion {
    id: number | string
    title: string
    location: string
    schedule: string
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    placeholder: 'Buscar eventos...',
    guestMode: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string]
    'search': [value: string]
    'clear': []
  }>()

  const router = useRouter()
  const { requireLogin } = useGuestMode()

  const inputRef = ref<HTMLInputElement | null>(null)
  const inputValue = ref(props.modelValue)
  const suggestions = ref<EventSuggestion[]>([])
  const isLoadingSuggestions = ref(false)
  const isOpen = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const DEBOUNCE_DELAY = SEARCH_DEBOUNCE_MS

  // Cancela a busca anterior quando uma nova é disparada (evita respostas fora de ordem)
  let suggestionsCtrl: AbortController | null = null

  watch(() => props.modelValue, val => {
    if (val !== inputValue.value) inputValue.value = val
  })

  const showClearButton = computed(
    () => inputValue.value.length > 0 && !isLoadingSuggestions.value,
  )

  function resolveSchedule (event: any): string {
    const candidates = [event.date, event.startDate, event.dateTime, event.startAt, event.eventDate]
    for (const val of candidates) {
      if (!val) continue
      const parsed = new Date(val)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      }
    }
    return ''
  }

  async function fetchSuggestions (query: string) {
    // Aborta a busca anterior antes de disparar a nova
    suggestionsCtrl?.abort()
    suggestionsCtrl = new AbortController()
    const { signal } = suggestionsCtrl

    try {
      const resp = props.guestMode
        ? await searchPublicEvents(query, 1, 6, signal)
        : await searchByEvents(query, 1, 6, signal)

      const events = unwrapList<any>(resp, 'events')
      suggestions.value = events.map((event: any) => ({
        id: event.id,
        title: event.name || event.title || '',
        location: event.location || event.address || '',
        schedule: resolveSchedule(event),
      }))
      isLoadingSuggestions.value = false
    } catch (error) {
      // Requisição substituída por outra mais recente: mantém o loading do request atual
      if (isRequestCanceled(error)) return
      logger.error('Erro ao buscar sugestões de autocomplete:', error)
      suggestions.value = []
      isLoadingSuggestions.value = false
    }
  }

  function handleInput (event: Event) {
    const value = (event.target as HTMLInputElement).value
    inputValue.value = value
    emit('update:modelValue', value)

    if (debounceTimer) clearTimeout(debounceTimer)

    if (!value.trim()) {
      suggestionsCtrl?.abort()
      suggestions.value = []
      isOpen.value = false
      isLoadingSuggestions.value = false
      return
    }

    isOpen.value = true
    isLoadingSuggestions.value = true

    debounceTimer = setTimeout(() => {
      fetchSuggestions(value.trim())
    }, DEBOUNCE_DELAY)
  }

  function handleSelect (suggestion: EventSuggestion) {
    inputValue.value = suggestion.title
    emit('update:modelValue', suggestion.title)
    isOpen.value = false
    suggestions.value = []

    // Visitante: explica por que precisa logar, em vez de mandar
    // silenciosamente para /public/Login sem contexto (P29)
    if (props.guestMode) {
      requireLogin('ver os detalhes deste evento')
      return
    }

    router.push({ path: `/private/event/${suggestion.id}` })
  }

  function handleKeydown (event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (debounceTimer) clearTimeout(debounceTimer)
      emit('search', inputValue.value)
      isOpen.value = false
    }
    if (event.key === 'Escape') {
      isOpen.value = false
    }
  }

  function handleBlur () {
    // mousedown.prevent nos itens do dropdown evita que este handler feche
    // o dropdown antes que o click seja registrado. Esta função cobre apenas
    // o caso de clicar fora do componente inteiro.
    isOpen.value = false
  }

  function handleFocus () {
    if (suggestions.value.length > 0 || isLoadingSuggestions.value) {
      isOpen.value = true
    }
  }

  function handleClear () {
    inputValue.value = ''
    suggestions.value = []
    isOpen.value = false
    if (debounceTimer) clearTimeout(debounceTimer)
    suggestionsCtrl?.abort()
    emit('update:modelValue', '')
    emit('clear')
    inputRef.value?.focus()
  }

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    suggestionsCtrl?.abort()
  })

  defineExpose({
    focus: () => inputRef.value?.focus(),
  })
</script>

<template>
  <div class="autocomplete-wrapper" :class="{ 'is-open': isOpen }">
    <!-- Input (visual idêntico ao SearchInput size="large") -->
    <div class="search-input-container search-input--large">
      <span aria-hidden="true" class="search-input-icon">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15z"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <input
        ref="inputRef"
        class="search-input-field"
        :placeholder="placeholder"
        type="text"
        :value="inputValue"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
        @keydown="handleKeydown"
      >

      <span v-if="isLoadingSuggestions" aria-label="Carregando sugestões" class="search-input-loading">
        <svg class="search-loading-spinner" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-dasharray="31.4 31.4"
            stroke-linecap="round"
            stroke-width="3"
          />
        </svg>
      </span>

      <button
        v-else-if="showClearButton"
        aria-label="Limpar busca"
        class="search-input-clear"
        type="button"
        @click="handleClear"
      >
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <!-- Dropdown de sugestões -->
    <Transition name="autocomplete-dropdown">
      <ul v-if="isOpen" aria-label="Sugestões de eventos" class="autocomplete-dropdown" role="listbox">
        <!-- Estado: carregando -->
        <li v-if="isLoadingSuggestions" class="autocomplete-state autocomplete-state--loading">
          <svg class="autocomplete-spinner" fill="none" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-dasharray="31.4 31.4"
              stroke-linecap="round"
              stroke-width="3"
            />
          </svg>
          <span>Carregando...</span>
        </li>

        <!-- Estado: vazio -->
        <li v-else-if="suggestions.length === 0" class="autocomplete-state autocomplete-state--empty">
          Nenhum evento encontrado
        </li>

        <!-- Sugestões -->
        <template v-else>
          <li
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="autocomplete-item"
            role="option"
            @click="handleSelect(suggestion)"
            @mousedown.prevent
          >
            <span aria-hidden="true" class="autocomplete-item-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" />
              </svg>
            </span>

            <div class="autocomplete-item-body">
              <span class="autocomplete-item-title">{{ suggestion.title }}</span>
              <span v-if="suggestion.location || suggestion.schedule" class="autocomplete-item-meta">
                <span v-if="suggestion.location">{{ suggestion.location }}</span>
                <span v-if="suggestion.location && suggestion.schedule" aria-hidden="true" class="meta-dot">·</span>
                <span v-if="suggestion.schedule">{{ suggestion.schedule }}</span>
              </span>
            </div>
          </li>
        </template>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
/* ─── Wrapper ──────────────────────────────────────────────────────────────── */
.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

/* ─── Input (replica SearchInput.vue — large variant) ─────────────────────── */
.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  color: #374151;
  transition: border-radius 0.15s ease;
}

.search-input-icon {
  position: absolute;
  left: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: #4b5563;
  transition: color 0.2s ease;
  z-index: 2;
}

.search-input-icon svg {
  width: 1.35rem;
  height: 1.35rem;
  stroke-width: 2.5;
}

.search-input-field {
  width: 100%;
  padding: 1rem 3.25rem 1rem 3.5rem;
  border: 2px solid #d1d5e0;
  border-radius: 16px;
  font-size: 1rem;
  font-family: inherit;
  /* Dupla declaração necessária: 'color' para Firefox; '-webkit-text-fill-color'
     para Chrome/Safari, que ignora 'color' quando essa propriedade está presente
     em qualquer ancestral (ex: Vuetify .v-application). */
  color: #1a1c2e !important;
  -webkit-text-fill-color: #1a1c2e !important;
  background-color: #ffffff !important;
  opacity: 1;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-input-field::placeholder {
  color: #6b7280 !important;
  -webkit-text-fill-color: #6b7280 !important;
  opacity: 1 !important;
}

.search-input-field:focus {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
}

.search-input-container:focus-within .search-input-icon {
  color: #ff5fa6;
}

.search-input-loading {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5fa6;
  z-index: 2;
}

.search-loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  animation: spin 1s linear infinite;
}

.search-input-clear {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

.search-input-clear:hover {
  background: rgba(255, 95, 166, 0.12);
  color: #ff5fa6;
}

.search-input-clear svg {
  width: 1rem;
  height: 1rem;
}

/* Quando o dropdown está aberto, remove a borda inferior do input
   para criar uma transição visual contínua com o dropdown */
.is-open .search-input-field {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  border-bottom-color: transparent;
}

/* ─── Dropdown ─────────────────────────────────────────────────────────────── */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin: 0;
  padding: 0.375rem 0;
  list-style: none;
  background: #ffffff;
  border: 2px solid #d1d5e0;
  border-top: none;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 8px 32px rgba(14, 23, 58, 0.12);
  overflow: hidden;
}

/* ─── Estados (loading / empty) ────────────────────────────────────────────── */
.autocomplete-state {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.25rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.autocomplete-state--loading {
  color: #ff5fa6;
}

.autocomplete-spinner {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
  color: #ff5fa6;
}

.autocomplete-state--empty {
  justify-content: center;
  font-style: italic;
  color: #9aa0b8;
  padding: 1.1rem;
}

/* ─── Item de sugestão ─────────────────────────────────────────────────────── */
.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1.25rem;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.autocomplete-item:hover {
  background: rgba(255, 95, 166, 0.06);
}

.autocomplete-item:last-child {
  border-radius: 0 0 14px 14px;
}

.autocomplete-item-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: #9aa0b8;
  transition: color 0.15s ease;
}

.autocomplete-item-icon svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 2.5;
}

.autocomplete-item:hover .autocomplete-item-icon {
  color: #ff5fa6;
}

.autocomplete-item-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.autocomplete-item-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #1a1c2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.autocomplete-item-meta {
  font-size: 0.75rem;
  color: #9aa0b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-dot {
  margin: 0 0.25rem;
}

/* ─── Animação de entrada/saída do dropdown ────────────────────────────────── */
.autocomplete-dropdown-enter-active,
.autocomplete-dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.autocomplete-dropdown-enter-from,
.autocomplete-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ─── Shared keyframe ──────────────────────────────────────────────────────── */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ─── Dark mode ────────────────────────────────────────────────────────────── */
/* O app não possui tema escuro. Força aparência light mesmo com OS em dark mode,
   garantindo texto escuro legível em fundo claro. */
@media (prefers-color-scheme: dark) {
  input.search-input-field {
    background-color: #ffffff !important;
    color: #1a1c2e !important;
    -webkit-text-fill-color: #1a1c2e !important;
    border-color: #d1d5e0;
  }

  input.search-input-field::placeholder {
    color: #6b7280 !important;
    -webkit-text-fill-color: #6b7280 !important;
    opacity: 1 !important;
  }
}
</style>
