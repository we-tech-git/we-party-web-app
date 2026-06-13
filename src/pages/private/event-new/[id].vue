<script setup lang="ts">
  import { definePage } from 'unplugin-vue-router/runtime'
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import NewEventDetails from '@/components/modules/Feed/NewEventDetails.vue'

  // Página de TESTE da nova tela de detalhes do evento.
  // Layout "blank": a própria NewEventDetails já traz header, hero e barra inferior.
  definePage({
    meta: {
      layout: 'blank',
    },
  })

  const route = useRoute()
  const eventId = computed(() => (route.params as Record<string, string>).id ?? '')
</script>

<template>
  <NewEventDetails :event-id="eventId" />
</template>
