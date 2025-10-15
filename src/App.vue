<template>
  <v-app>
    <LanguageSwitcher />
    <router-view />
  </v-app>
</template>

<script lang="ts" setup>
  import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
  import router from './router'
  import { STORAGE_KEY_NAME } from './utils/storageKeys'

  function checkUser (): void {
    const token = localStorage.getItem(STORAGE_KEY_NAME.ACCESS_TOKEN)
    if (token) {
      router.push('/public/Login')
    } else {
      router.push('/public/Signup')
    }
  }

  checkUser()

</script>
