<script setup>
  import Login from '@/components/modules/Login/Login.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  useSeoMeta({
    title: 'Entrar | We Party',
    description: 'Acesse sua conta We Party para descobrir eventos perto de você e continuar de onde parou.',
    path: '/public/Login',
  })
</script>

<template>

  <Login />
</template>
