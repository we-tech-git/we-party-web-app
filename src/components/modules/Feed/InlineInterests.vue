<script setup lang="ts">
/**
 * Painel de interesses do evento, aberto abaixo do card.
 *
 * Usa o mesmo InlinePanel dos comentários, então a animação de abrir e a caixa
 * branca são idênticas — antes isto era um overlay flutuante sobre a capa,
 * destoando dos demais botões da barra de ações.
 *
 * Cada interesse vira um SelectableChip e o clique alterna:
 * - em contorno com "+" → adiciona ao perfil (mesmo formato das sugestões);
 * - preenchido → remove do perfil.
 */
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { addUserInterest, removeUserInterest } from '@/api/interest'
  import InlinePanel from '@/components/UI/InlinePanel/InlinePanel.vue'
  import SelectableChip from '@/components/UI/SelectableChip/SelectableChip.vue'
  import { logger } from '@/utils/logger'

  export interface EventInterestRef {
    id: string
    name: string
  }

  const props = defineProps<{
    visible: boolean
    /** Interesses do evento com id — necessário para adicionar/remover. */
    interestRefs?: EventInterestRef[]
    /** Nomes dos interesses que o usuário já possui. */
    matchedInterests?: string[]
    /** Sem sessão não há a quem adicionar: os chips ficam somente leitura. */
    guestMode?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'changed', payload: { interest: EventInterestRef, isMine: boolean }): void
  }>()

  const { t } = useI18n()

  /**
   * Alterações feitas nesta sessão, por id. Sobrepõem `matchedInterests`, que
   * vem do carregamento do feed e não é reemitido a cada clique.
   */
  const localState = ref<Record<string, boolean>>({})
  const pendingId = ref<string | null>(null)

  const matchedLower = computed(
    () => new Set((props.matchedInterests ?? []).map(name => name.toLowerCase())),
  )

  const chips = computed(() =>
    (props.interestRefs ?? []).map(item => ({
      ...item,
      isMine: localState.value[item.id] ?? matchedLower.value.has(item.name.toLowerCase()),
    })),
  )

  const suggestionsCount = computed(() => chips.value.filter(c => !c.isMine).length)

  async function toggleInterest (interest: EventInterestRef, isMine: boolean) {
    if (pendingId.value) return // evita disparo duplo

    pendingId.value = interest.id
    try {
      await (isMine ? removeUserInterest(interest.id) : addUserInterest(interest.id))
      localState.value = { ...localState.value, [interest.id]: !isMine }
      emit('changed', { interest, isMine: !isMine })
    } catch (error) {
      logger.error('Erro ao alternar interesse a partir do card:', error)
    } finally {
      pendingId.value = null
    }
  }
</script>

<template>
  <InlinePanel :visible="visible">
    <div class="ii-header">
      <div class="ii-title-group">
        <h4 class="ii-title">{{ t('feed.interests.title') }}</h4>
        <span class="ii-count-badge">{{ chips.length }}</span>
      </div>
    </div>

    <div class="ii-body">
      <p v-if="!guestMode && suggestionsCount > 0" class="ii-hint">
        {{ t('feed.interests.hint') }}
      </p>

      <div v-if="chips.length > 0" class="ii-chips">
        <SelectableChip
          v-for="chip in chips"
          :key="chip.id"
          :is-selected="chip.isMine"
          :label="chip.name"
          :loading="pendingId === chip.id"
          :readonly="guestMode"
          @toggle="toggleInterest(chip, chip.isMine)"
        />
      </div>

      <p v-else class="ii-empty">{{ t('feed.interests.empty') }}</p>
    </div>
  </InlinePanel>
</template>

<style scoped>
/* Cabeçalho espelha o dos comentários (.ic-header) para os dois painéis
   abrirem com o mesmo respiro. */
.ii-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem 1.1rem 0.6rem;
}

.ii-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ii-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #16171f;
  letter-spacing: -0.01em;
}

.ii-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(255, 47, 146, 0.12);
  color: #ff2f92;
  font-size: 0.76rem;
  font-weight: 800;
}

.ii-body {
  padding: 0 1.1rem 1.1rem;
}

.ii-hint {
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6b7194;
}

.ii-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ii-empty {
  margin: 0;
  font-size: 0.85rem;
  color: #9aa0b8;
}

@media (max-width: 360px) {
  .ii-header {
    padding: 0.85rem 0.85rem 0.25rem;
  }

  .ii-body {
    padding: 0 0.85rem 0.85rem;
  }
}
</style>
