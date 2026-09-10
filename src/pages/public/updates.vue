<script setup lang="ts">
  import NewsUpdates from '@/components/modules/NewsUpdates/NewsUpdates.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  definePage({
    meta: { layout: 'blank' },
  })

  useSeoMeta({
    title: 'Novidades | We Party',
    description: 'Fique por dentro das últimas novidades, atualizações e melhorias do We Party.',
    path: '/public/updates',
  })
</script>

<template>
  <NewsUpdates />
</template>
