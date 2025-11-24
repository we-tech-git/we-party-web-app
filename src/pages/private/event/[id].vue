<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router/auto'
  import EventView from '@/components/modules/Feed/EventView.vue'

  definePage({
    meta: {
      layout: 'default',
    },
  })

  const route = useRoute('/private/event/[id]')
  const eventId = computed(() => route.params.id)
</script>

<template>
  <EventView :event-id="eventId" />
</template>
