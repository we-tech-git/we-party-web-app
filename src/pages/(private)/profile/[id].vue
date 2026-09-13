<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import PublicProfile from '@/components/modules/Profile/PublicProfile.vue'

  const route = useRoute('/profile/[id]')
  const userId = computed(() => String(route.params.id))
</script>

<template>
  <PublicProfile :key="userId" :user-id="userId" />
</template>
