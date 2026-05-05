<script setup lang="ts">
  import FeedModule from '@/components/modules/Feed/Feed.vue'
  import LoginRequiredDialog from '@/components/UI/LoginRequiredDialog/LoginRequiredDialog.vue'

  definePage({
    meta: { layout: 'default' },
  })
</script>

<template>
  <FeedModule guest-mode />
  <LoginRequiredDialog />
</template>
