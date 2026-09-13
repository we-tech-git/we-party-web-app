<script setup lang="ts">
  import ResetPassword from '@/components/modules/PasswordRecovery/ResetPassword.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  useSeoMeta({
    title: 'Redefinir senha | We Party',
    description: 'Crie uma nova senha para sua conta We Party.',
    path: '/ResetPassword',
  })
</script>

<template>
  <ResetPassword />
</template>
