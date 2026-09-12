<script setup lang="ts">
  // Extraído de Profile.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 2ª fatia da
  // decomposição do mega-arquivo (7 modais quase idênticos, ver estratégia
  // completa no plano). Modal de gerenciar interesses do usuário: busca,
  // sugestões e lista temporária (só persiste na API quando "Concluído" é
  // clicado).
  //
  // Toda a lógica de busca/estado fica no pai (`Profile.vue`) — este
  // componente só renderiza e emite eventos. `searchQuery` segue o mesmo
  // padrão `modelValue`/`update:modelValue` já usado em outros componentes
  // do design system (ex. `SearchInput`, `Snackbar`), só que nomeado
  // `search-query` porque o pai também precisa ler o valor atual fora do
  // v-model (`openRequestModal` usa `interestsSearchQuery.trim()` como
  // sugestão inicial do nome a solicitar).
  //
  // Achado ao extrair: `.btn-cancel` tinha 2 definições conflitantes no
  // arquivo original (uma pensada pra este modal/Request, outra pra Editar
  // Perfil/Crop) — a segunda, por vir depois no CSS, "vencia" a cascata e
  // aplicava seu estilo (padding/borda diferentes) neste modal por engano.
  // Ao isolar em `<style scoped>` próprio, esse vazamento desaparece e o
  // botão passa a usar o estilo que este modal sempre teve como próprio
  // (ver REFACTOR_AUDIT_PLAN.md para mais detalhes) — mudança visual
  // pequena, mas real, resultado direto da decomposição.
  import type { UserInterest } from './types'

  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'

  const props = defineProps<{
    visible: boolean
    searchQuery: string
    searching: boolean
    searchResults: UserInterest[]
    loadingSuggestions: boolean
    suggestions: UserInterest[]
    currentInterests: UserInterest[]
    saving: boolean
  }>()

  const emit = defineEmits<{
    'update:searchQuery': [value: string]
    'search': [query: string]
    'clear-search': []
    'add': [interest: UserInterest]
    'remove': [interestId: string]
    'save': []
    'close': []
    'request-new': []
  }>()

  const { t } = useI18n()

  const searchQueryModel = computed({
    get: () => props.searchQuery,
    set: (value: string) => emit('update:searchQuery', value),
  })
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="interests-modal-container">
          <div class="interests-modal-header">
            <h2>{{ t('profile.interestsModal.title') }}</h2>
            <button class="modal-close" @click="emit('close')">
              <i class="mdi mdi-close" />
            </button>
          </div>

          <div class="interests-modal-body">
            <!-- Busca de interesses -->
            <div class="interests-search-section">
              <SearchInput
                v-model="searchQueryModel"
                :loading="searching"
                :placeholder="t('profile.interests.searchPlaceholder')"
                @clear="emit('clear-search')"
                @search="emit('search', $event)"
              />
            </div>

            <!-- Estado de loading -->
            <div v-if="searching && searchQuery.trim()" class="loading-suggestions">
              <AppLoader size="md" :text="t('profile.interests.searching') || 'Buscando interesses...'" />
            </div>

            <!-- Resultados da busca -->
            <div v-else-if="searchQuery.trim() && searchResults.length > 0" class="search-results-section">
              <h4>{{ t('profile.interests.searchResults') }}</h4>
              <div class="interests-list">
                <div v-for="interest in searchResults" :key="interest.id" class="interest-item">
                  <span class="interest-name">{{ interest.name }}</span>
                  <button class="add-btn" @click="emit('add', interest)">
                    <i class="mdi mdi-plus" />
                    {{ t('profile.interests.add') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Mensagem quando não há resultados -->
            <div
              v-else-if="searchQuery.trim() && !searching && searchResults.length === 0"
              class="no-results"
            >
              <i class="mdi mdi-emoticon-sad-outline" />
              <p>{{ t('profile.interests.noResults') }}</p>
              <button class="request-interest-btn" @click="emit('request-new')">
                <i class="mdi mdi-plus-circle" />
                {{ t('profile.interests.requestNew') }}
              </button>
            </div>

            <!-- Sugestões de interesses (quando não há busca ativa) -->
            <div v-if="!searchQuery.trim()" class="suggestions-section">
              <h4>{{ t('profile.interests.suggestions') }}</h4>
              <div v-if="loadingSuggestions" class="loading-suggestions">
                <AppLoader size="md" :text="t('profile.interests.loadingSuggestions')" />
              </div>
              <div v-else-if="suggestions.length > 0" class="interests-list">
                <div v-for="interest in suggestions" :key="interest.id" class="interest-item">
                  <span class="interest-name">{{ interest.name }}</span>
                  <button class="add-btn" @click="emit('add', interest)">
                    <i class="mdi mdi-plus" />
                    {{ t('profile.interests.add') }}
                  </button>
                </div>
              </div>
              <p v-else class="empty-suggestions">
                {{ t('profile.interests.noSuggestions') }}
              </p>
            </div>

            <!-- Meus interesses atuais -->
            <div class="current-interests-section">
              <h4>{{ t('profile.interests.myInterests') }} ({{ currentInterests.length }})</h4>
              <div v-if="currentInterests.length > 0" class="interests-list">
                <div v-for="interest in currentInterests" :key="interest.id" class="interest-item current">
                  <span class="interest-name">{{ interest.name }}</span>
                  <button class="remove-btn" @click="emit('remove', interest.id)">
                    <i class="mdi mdi-close" />
                    {{ t('profile.interests.remove') }}
                  </button>
                </div>
              </div>
              <p v-else class="empty-message">
                {{ t('profile.interests.emptyMessage') }}
              </p>
            </div>
          </div>

          <div class="interests-modal-footer">
            <button class="btn-cancel" @click="emit('close')">
              {{ t('profile.interestsModal.cancel') }}
            </button>
            <button class="btn-done" :disabled="saving" @click="emit('save')">
              <i v-if="saving" class="mdi mdi-loading mdi-spin" />
              {{ saving ? t('profile.interestsModal.saving') : t('profile.interestsModal.done') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Duplicado de Profile.vue — esqueleto genérico de modal (ver comentário
   em ProfileFollowListModal.vue). */
.modal-overlay {
  --color-primary: #ff5fa6;
  --color-text-primary: #1a1c2e;
  --color-text-secondary: #555b77;
  --color-border: rgba(0, 0, 0, 0.04);
  --color-border-strong: #e0e2ed;
  --shadow-primary: 0 4px 16px rgba(255, 95, 166, 0.25);

  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #555b77;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1c2e;
}

.modal-enter-active {
  transition: all 0.15s ease-out;
}

.modal-leave-active {
  transition: all 0.1s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* O original só tem o fade acima pra este modal — a variante com
   scale/translateY (`.modal-enter-from .modal-container`) não se aplica
   aqui porque a raiz deste modal é `.interests-modal-container`, uma
   classe diferente de `.modal-container` (usada pelos modais de
   seguidores/seguindo/editar perfil). Preservado assim de propósito. */

/* Exclusivo deste modal. */
.interests-modal-container {
  background: white;
  border-radius: 20px;
  width: min(560px, 90vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.interests-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.interests-modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1a1c2e;
  font-weight: 700;
}

.interests-modal-body {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  flex: 1;
}

.interests-search-section {
  margin-bottom: 1.5rem;
}

.search-results-section {
  margin-bottom: 2rem;
}

.search-results-section h4,
.suggestions-section h4,
.current-interests-section h4 {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9aa0b8;
  font-weight: 600;
}

.interests-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.interest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  transition: all 0.2s;
}

.interest-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.interest-item.current {
  background: linear-gradient(135deg, rgba(255, 154, 77, 0.08), rgba(255, 95, 143, 0.08));
}

.interest-item.current:hover {
  background: linear-gradient(135deg, rgba(255, 154, 77, 0.12), rgba(255, 95, 143, 0.12));
}

.interest-name {
  font-size: 0.95rem;
  color: #1a1c2e;
  font-weight: 500;
}

.add-btn,
.remove-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Baloo Thambi 2', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s;
}

.add-btn {
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.2);
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: #9aa0b8;
}

.no-results i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.no-results p {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
}

.request-interest-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  font-family: 'Baloo Thambi 2', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.2);
}

.request-interest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.request-interest-btn i {
  font-size: 1.2rem;
}

.suggestions-section {
  margin-top: 1rem;
}

.loading-suggestions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 0.75rem;
  color: #9aa0b8;
}

.empty-suggestions {
  text-align: center;
  padding: 2rem 1rem;
  color: #9aa0b8;
  font-size: 0.9rem;
  margin: 0;
}

.current-interests-section {
  margin-top: 2rem;
}

.empty-message {
  text-align: center;
  padding: 2rem 1rem;
  color: #9aa0b8;
  font-size: 0.9rem;
  margin: 0;
}

.interests-modal-footer {
  padding: 1.25rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Estilo "correto" deste modal (ver achado no comentário do <script>). */
.btn-cancel {
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  color: #6c7080;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.2);
}

.btn-cancel:active {
  transform: scale(0.98);
}

.btn-done {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Baloo Thambi 2', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.2);
}

.btn-done:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 95, 166, 0.3);
}

.btn-done:active {
  transform: translateY(0);
}

.btn-done:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-done:disabled:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.2);
}

/* Duplicado de Profile.vue — usado pelos ícones de loading (busca de
   interesses, salvar) acima (achado retroativo, ver comentário em
   ProfileEditModal.vue). */
.mdi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* Duplicado de Profile.vue — regra global de acessibilidade (achado
   retroativo, ver ProfileFollowListModal.vue). */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
