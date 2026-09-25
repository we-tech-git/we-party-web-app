<script setup lang="ts">
  import { definePage } from 'unplugin-vue-router/runtime'
  import { computed } from 'vue'
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

  const route = useRoute('/interests/[slug]')
  const slug = computed(() => String(route.params.slug))
  const store = useInterestPageStore()

  // Passa uma função (não um objeto já resolvido) — `useSeoMeta` reavalia
  // sozinho quando `store.interest` muda, sem precisar de `watch` (chamar
  // `useHead` fora do corpo síncrono de `setup()` quebra a injeção de
  // contexto do Vue). Título/descrição genéricos até a página carregar.
  useSeoMeta(() => {
    const interest = store.interest
    // Sem capa curada, o preview do link usa a imagem do 1º evento (a mesma que
    // abre o slideshow do hero). `og:image` precisa ser URL absoluta.
    const image = interest?.coverImageUrl || store.heroSlides[0]?.image
    return {
      title: interest ? `${interest.name} | We Party` : 'We Party',
      description: interest?.welcomeText || interest?.description
        || 'Descubra eventos, pessoas e conversas por interesse no We Party.',
      // Canonical pelo slug quando existe — a rota também abre por id, e as
      // duas URLs não devem competir como páginas diferentes.
      path: `/interests/${interest?.slug ?? slug.value}`,
      image: image && /^https?:\/\//.test(image) ? image : undefined,
    }
  })
</script>

<template>
  <InterestPage :slug="slug" />
</template>
