<script setup lang="ts">
  import RequestPassword from '@/components/modules/PasswordRecovery/RequestPassword.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  useSeoMeta({
    title: 'Recuperar senha | We Party',
    description: 'Solicite a redefinição da sua senha para voltar a acessar sua conta We Party.',
    path: '/RequestPassword',
  })
</script>

<template>
  <RequestPassword />
</template>
