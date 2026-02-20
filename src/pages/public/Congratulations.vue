<script setup>
  import Congratulations from '@/components/modules/Congratulations/Congratulations.vue'

  definePage({
    meta: {
      layout: 'blank',
    },
  })
</script>

<template>
  <Congratulations continue-to="/private/feed" />
</template>
