<template>
  <v-app>
    <router-view />
    <ShareSheet />
  </v-app>
</template>

<script lang="ts" setup>
  import ShareSheet from '@/components/modules/UI/ShareSheet/ShareSheet.vue'
  import { useI18n } from 'vue-i18n'
  import { watchEffect } from 'vue'

  const { locale } = useI18n()

  watchEffect(() => {
    document.documentElement.lang = locale.value
  })
</script>
