<script setup lang="ts">
  import LandingPage from '@/components/modules/Landingpage/LandingPage.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  definePage({
    meta: { layout: 'blank' },
  })

  useSeoMeta({
    title: 'We Party — Descubra eventos e conecte-se com quem vai',
    description: 'Encontre festas, shows e eventos perto de você, veja quem vai participar e conecte-se com outras pessoas antes mesmo do evento começar.',
    path: '/',
  })
</script>

<template>
  <LandingPage />
</template>
