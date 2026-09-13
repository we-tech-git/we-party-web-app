<script setup lang="ts">
  import FeedModule from '@/components/modules/Feed/Feed.vue'
  import LoginRequiredDialog from '@/components/UI/LoginRequiredDialog/LoginRequiredDialog.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  definePage({
    meta: { layout: 'default' },
  })

  useSeoMeta({
    title: 'Explorar eventos | We Party',
    description: 'Veja o feed de eventos do We Party e experimente a plataforma antes de criar sua conta.',
    path: '/explore',
  })
</script>

<template>
  <FeedModule guest-mode />
  <LoginRequiredDialog />
</template>
