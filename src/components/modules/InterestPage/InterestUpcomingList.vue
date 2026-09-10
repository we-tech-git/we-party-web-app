<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  const props = defineProps<{
    events: any[]
  }>()

  const router = useRouter()
  const { t } = useI18n()

  /**
   * Badge de urgência — cálculo do front a partir de `startDate`, sem campo
   * novo de backend (decisão do plano): ≤7 dias vermelho, 8–30 laranja,
   * >30 neutro.
   */
  function urgency (startDate: string): 'soon' | 'near' | 'far' {
    const days = (new Date(startDate).getTime() - Date.now()) / 86_400_000
    if (days <= 7) return 'soon'
    if (days <= 30) return 'near'
    return 'far'
  }

  function urgencyLabel (startDate: string): string {
    const date = new Date(startDate)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const items = computed(() => props.events.map(evt => ({
    ...evt,
    urgency: urgency(evt.startDate),
    label: urgencyLabel(evt.startDate),
  })))

  function goToEvent (id: string) {
    router.push(`/private/event/${id}`)
  }
</script>

<template>
  <section v-if="items.length > 0" aria-labelledby="upcoming-heading" class="iu-section">
    <h2 id="upcoming-heading" class="iu-title">{{ t('interestPage.upcoming.title') }}</h2>
    <div class="iu-list">
      <button
        v-for="item in items"
        :key="item.id"
        class="iu-item"
        type="button"
        @click="goToEvent(item.id)"
      >
        <span class="iu-badge" :class="`iu-badge--${item.urgency}`">{{ item.label }}</span>
        <span class="iu-item-title">{{ item.title }}</span>
        <span v-if="item.location" class="iu-item-location">{{ item.location }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.iu-section {
  max-width: 720px;
  margin: 2rem auto 0;
  padding: 0 1.25rem;
}

.iu-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #16171f;
  margin: 0 0 0.75rem;
}

.iu-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.iu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-align: left;
  width: 100%;
  background: #fff;
  border: 1px solid #ececf3;
  border-radius: 14px;
  padding: 0.65rem 0.9rem;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.iu-item:hover {
  box-shadow: 0 4px 14px rgba(20, 20, 40, 0.08);
  transform: translateY(-1px);
}

.iu-badge {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.22rem 0.5rem;
  border-radius: 10px;
}

.iu-badge--soon {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.iu-badge--near {
  background: rgba(255, 154, 77, 0.16);
  color: #d97706;
}

.iu-badge--far {
  background: rgba(0, 0, 0, 0.06);
  color: #6b6f80;
}

.iu-item-title {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  font-size: 0.88rem;
  color: #16171f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iu-item-location {
  flex-shrink: 0;
  font-size: 0.78rem;
  color: #9599ab;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
