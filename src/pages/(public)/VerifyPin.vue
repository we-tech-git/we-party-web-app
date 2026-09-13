<script setup lang="ts">
  import VerifyPin from '@/components/modules/PasswordRecovery/VerifyPin.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  useSeoMeta({
    title: 'Verificar código | We Party',
    description: 'Informe o código de verificação enviado para confirmar sua identidade no We Party.',
    path: '/VerifyPin',
  })
</script>

<template>
  <VerifyPin />
</template>
