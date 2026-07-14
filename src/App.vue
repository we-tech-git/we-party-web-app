<script lang="ts" setup>
  import { watchEffect } from 'vue'
  import { useI18n } from 'vue-i18n'
  import ShareSheet from '@/components/modules/UI/ShareSheet/ShareSheet.vue'
  import ErrorBoundary from '@/components/UI/ErrorBoundary/ErrorBoundary.vue'

  const { locale } = useI18n()

  watchEffect(() => {
    document.documentElement.lang = locale.value
  })
</script>

<template>
  <v-app>
    <!-- ErrorBoundary: erro de render em qualquer página mostra fallback
         com "Tentar Novamente" em vez de tela branca -->
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
    <ShareSheet />
  </v-app>
</template>
