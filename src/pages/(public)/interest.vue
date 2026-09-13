<script setup lang="ts">
  import Interest from '@/components/modules/interest/Interest.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  useSeoMeta({
    title: 'Seus interesses | We Party',
    description: 'Escolha seus interesses no We Party para receber recomendações de eventos personalizadas.',
    path: '/interest',
  })
</script>

<template>
  <Interest />
</template>
