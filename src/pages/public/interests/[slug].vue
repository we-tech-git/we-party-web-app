<script setup lang="ts">
  import { definePage } from 'unplugin-vue-router/runtime'
  import { computed, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import InterestPage from '@/components/modules/InterestPage/InterestPage.vue'
  import { useSeoMeta } from '@/composables/useSeoMeta'
  import { useInterestPageStore } from '@/stores/interestPage'

  // Layout "blank": InterestPage já traz seu próprio header via InterestHero.
  definePage({
    meta: {
      layout: 'blank',
    },
  })

  const route = useRoute('/public/interests/[slug]')
  const slug = computed(() => String(route.params.slug))
  const store = useInterestPageStore()

  // Título/descrição genéricos até a página carregar; atualizados assim
  // que `interest` chega (mesma store que `InterestPage.vue` consome).
  watch(
    () => store.interest,
    interest => {
      useSeoMeta({
        title: interest ? `${interest.name} | We Party` : 'We Party',
        description: interest?.welcomeText || interest?.description
          || 'Descubra eventos, pessoas e conversas por interesse no We Party.',
        path: `/public/interests/${slug.value}`,
        image: interest?.coverImageUrl || undefined,
      })
    },
    { immediate: true },
  )
</script>

<template>
  <InterestPage :slug="slug" />
</template>
