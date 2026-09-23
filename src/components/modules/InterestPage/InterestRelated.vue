<script setup lang="ts">
  import type { RelatedInterest } from '@/utils/relatedInterests'
  import { useI18n } from 'vue-i18n'

  defineProps<{
    interestName: string
    interests: RelatedInterest[]
  }>()

  const { t } = useI18n()
</script>

<template>
  <section v-if="interests.length > 0" aria-labelledby="related-heading" class="ir-section">
    <p class="ir-kicker">{{ t('interestPage.related.kicker') }}</p>
    <h2 id="related-heading" class="ir-title">{{ t('interestPage.related.title', { name: interestName }) }}</h2>

    <!-- `v-chip` com `:to` vira <a> de verdade (abre em nova aba, leitor de tela anuncia link) -->
    <div class="ir-chips">
      <v-chip
        v-for="item in interests"
        :key="item.id"
        class="ir-chip"
        color="primary"
        :data-testid="`interest-related-chip-${item.slug}`"
        size="default"
        :to="`/interests/${item.slug}`"
        variant="outlined"
      >
        <span v-if="item.emoji" aria-hidden="true" class="ir-chip-emoji">{{ item.emoji }}</span>
        {{ item.name }}
      </v-chip>
    </div>
  </section>
</template>

<style scoped>
.ir-section {
  max-width: 810px;
  margin: 2.5rem auto 0;
  padding: 0 1.25rem;
}

.ir-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f978a3;
}

.ir-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-dark);
  margin: 0 0 1.1rem;
}

.ir-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

/* Mesmo visual dos chips de filtro do "Tá chegando" (Vuetify outlined + primary).
   `!important` no texto: o Vuetify força a cor primária (rosa) com !important. */
.ir-chip {
  font-weight: 700;
  border-color: var(--color-primary);
  background: #fff;
  color: var(--color-dark) !important;
  box-shadow: none;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.ir-chip:hover {
  background: var(--gradient-primary);
  border-color: transparent;
  color: #fff !important;
}

/* Sem o "véu" de hover do Vuetify por cima do gradiente (desbotava a cor) */
.ir-chip:hover :deep(.v-chip__overlay) {
  opacity: 0;
}

.ir-chip-emoji {
  margin-right: 0.35rem;
}
</style>
