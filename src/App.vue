<template>
  <v-app>
    <router-view />
    <ShareSheet />
  </v-app>
</template>

<script lang="ts" setup>
  import ShareSheet from '@/components/modules/UI/ShareSheet/ShareSheet.vue'
</script>
