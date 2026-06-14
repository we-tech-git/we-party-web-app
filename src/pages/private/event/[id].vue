<script setup lang="ts">
  import { definePage } from 'unplugin-vue-router/runtime'
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import NewEventDetails from '@/components/modules/Feed/NewEventDetails.vue'

  // Usa a nova tela de detalhes do evento (NewEventDetails).
  // Layout "blank": a própria NewEventDetails já traz header, hero e barra inferior.
  // A tela antiga (EventView/EventDetails) permanece no projeto, mas fora de uso.
  definePage({
    meta: {
      layout: 'blank',
    },
  })

  const route = useRoute('/private/event/[id]')
  const eventId = computed(() => route.params.id)
</script>

<template>
  <NewEventDetails :event-id="eventId" />
</template>

<style scoped>
.map-button {
  background: #fff;
  color: #23253f;
  border: 1px solid #e0e0e0;
  border-radius: 999px;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: background 0.2s;
}

.map-button:hover {
  background: #ffe0f0;
}
</style>
