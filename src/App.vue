<template>
  <v-app>
    <LanguageSwitcher />
    <router-view />
  </v-app>
</template>

<script lang="ts" setup>
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
</script>
