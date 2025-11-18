<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router/auto'
  import EventDetails from '@/components/modules/Feed/EventDetails.vue'

  definePage({
    meta: {
      layout: 'default',
    },
  })

  const route = useRoute('/private/event/[id]')
  const eventId = computed(() => route.params.id)

</script>

<template>
  <EventDetails :event-id="eventId" />
</template>
