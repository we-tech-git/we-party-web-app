<script lang="ts" setup>
  import { watch, watchEffect } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTheme } from 'vuetify'
  import ShareSheet from '@/components/modules/UI/ShareSheet/ShareSheet.vue'
  import { useThemeMode } from '@/composables/useThemeMode'

  const { locale } = useI18n()
  const vuetifyTheme = useTheme()
  const { isDark } = useThemeMode()

  watchEffect(() => {
    document.documentElement.lang = locale.value
  })

  // Sincroniza o tema do Vuetify com o estado global do dark mode
  watch(isDark, (dark) => {
    vuetifyTheme.global.name.value = dark ? 'dark' : 'light'
  }, { immediate: true })
</script>

<template>
  <v-app>
    <router-view />
    <ShareSheet />
  </v-app>
</template>
