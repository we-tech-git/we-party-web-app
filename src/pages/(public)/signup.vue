<script setup>
  import Signup from '@/components/modules/Signup/Signup.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  useSeoMeta({
    title: 'Criar conta | We Party',
    description: 'Cadastre-se gratuitamente no We Party e comece a descobrir festas, shows e eventos perto de você.',
    path: '/signup',
  })
</script>

<template>

  <Signup />
</template>
