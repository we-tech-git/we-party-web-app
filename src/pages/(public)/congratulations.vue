<script setup>
  import Congratulations from '@/components/modules/Congratulations/Congratulations.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  definePage({
    meta: {
      layout: 'blank',
    },
  })

  useSeoMeta({
    title: 'Cadastro concluído | We Party',
    description: 'Sua conta We Party foi criada com sucesso. Comece agora a descobrir eventos perto de você.',
    path: '/congratulations',
  })
</script>

<template>
  <Congratulations continue-to="/feed" />
</template>
