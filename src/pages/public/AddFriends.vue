<script setup>
  import AddFriends from '@/components/modules/AddFriends/AddFriends.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'

  definePage({
    meta: { layout: 'blank' },
  })

  useSeoMeta({
    title: 'Adicionar amigos | We Party',
    description: 'Encontre e adicione amigos no We Party para saber quais eventos eles vão curtir com você.',
    path: '/public/AddFriends',
  })
</script>

<template>
  <AddFriends />
</template>
