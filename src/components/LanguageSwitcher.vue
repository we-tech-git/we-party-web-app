<template>
  <div class="language-switcher">
    <v-menu>
      <template #activator="{ props }">
        <v-btn v-bind="props" color="grey-darken-1" icon variant="text">
          <v-icon>mdi-web</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item v-for="lang in availableLanguages" :key="lang.code" @click="changeLanguage(lang.code)">
          <v-list-item-title>{{ lang.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'

  // Acessa a instância do i18n
  const { locale } = useI18n()

  // Lista de idiomas disponíveis
  const availableLanguages = [
    { code: 'pt-BR', name: 'Português' },
    { code: 'en-US', name: 'English' },
  ]

  // Função para trocar o idioma
  function changeLanguage (langCode: string) {
    locale.value = langCode
  }
</script>

<style scoped>
.language-switcher {

  z-index: 50;
}
</style>
