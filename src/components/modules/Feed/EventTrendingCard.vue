<script setup lang="ts">
  // Extraído de NewEventDetails.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 2ª
  // fatia da decomposição do mega-arquivo. Card "O que tá rolando?" (lista
  // de eventos em alta) da coluna direita.
  //
  // A busca (`fetchTrending`/`mapTrend`, que usa `resolveAsset`/
  // `eventsStore` — compartilhados com outras partes do arquivo) continua
  // no pai; este componente só recebe a lista já mapeada e cuida da
  // exibição "Mostrar mais/menos" e da navegação pro evento (`router.push`
  // direto, mesmo padrão de `FeedTrendsPanel.vue`/`FeedTrendingMobile.vue`).
  import { computed, ref } from 'vue'
  import router from '@/router'

  interface TrendVM {
    id: string | number
    initial: string
    color: string
    image: string
    venue: string
    title: string
    likes: number
  }

  const props = defineProps<{
    trending: TrendVM[]
    loading: boolean
  }>()

  // Quantidade de tendências exibidas inicialmente (comportamento da tela
  // antiga: o botão "Mostrar mais" expande de uma vez e vira "Mostrar
  // menos" para recolher).
  const TREND_INITIAL_COUNT = 5
  const visibleCount = ref(TREND_INITIAL_COUNT)

  const visibleTrending = computed(() => props.trending.slice(0, visibleCount.value))
  const trendHasMore = computed(() => props.trending.length > visibleCount.value)
  const trendIsExpanded = computed(() => visibleCount.value > TREND_INITIAL_COUNT)

  function showMoreTrending () {
    visibleCount.value = props.trending.length
  }

  function showLessTrending () {
    visibleCount.value = TREND_INITIAL_COUNT
  }

  function goToTrend (trend: TrendVM) {
    if (!trend.id) return
    router.push(`/private/event/${trend.id}`)
  }
</script>

<template>
  <!-- Trending card -->
  <div class="bg-white border border-black/5 rounded-3xl p-5 shadow-sm">
    <h3 class="font-display font-bold text-[19px]">O que tá rolando?</h3>
    <p class="text-gray-400 font-semibold text-sm mb-2">Tendência na sua cidade</p>

    <a
      v-for="trend in visibleTrending"
      :key="trend.id"
      class="trend-card flex items-center gap-3 p-3 mb-2.5 rounded-2xl transition-all cursor-pointer hover:-translate-y-0.5"
      href="#"
      @click.prevent="goToTrend(trend)"
    >
      <img
        v-if="trend.image"
        :alt="trend.title"
        class="w-12 h-12 rounded-2xl flex-none object-cover"
        loading="lazy"
        :src="trend.image"
      >
      <span
        v-else
        class="w-12 h-12 rounded-2xl flex-none grid place-items-center text-white font-display font-extrabold text-xl"
        :style="{ background: trend.color }"
      >{{ trend.initial }}</span>
      <div class="min-w-0">
        <span
          class="block text-[10px] font-extrabold tracking-widest uppercase text-weparty-pink truncate"
        >{{
          trend.venue }}</span>
        <b class="text-sm block leading-tight my-0.5 truncate">{{ trend.title }}</b>
        <small class="text-gray-400 font-semibold text-xs">🤍 {{ trend.likes }} curtidas</small>
      </div>
    </a>

    <button
      v-if="trendHasMore"
      class="w-full mt-3.5 bg-pink-50 text-weparty-pink font-extrabold rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-pink-100 transition-all disabled:opacity-60"
      :disabled="loading"
      @click="showMoreTrending"
    >
      {{ loading ? 'Carregando...' : 'Mostrar mais' }}
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        viewBox="0 0 24 24"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <button
      v-else-if="trendIsExpanded"
      class="w-full mt-3.5 bg-pink-50 text-weparty-pink font-extrabold rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-pink-100 transition-all"
      @click="showLessTrending"
    >
      Mostrar menos
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        viewBox="0 0 24 24"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Duplicado de NewEventDetails.vue — classes-base usadas por várias
   seções ainda não extraídas. */
.text-weparty-pink {
    color: #ff5fa6;
}

.bg-pink-50 {
    background: #fdf2f8;
}

.font-display {
    font-family: 'Poppins', sans-serif;
}

/* Exclusivo deste componente. */
.trend-card {
    background: linear-gradient(135deg, #fff6f9 0%, #fff1e8 100%);
    border: 1px solid rgba(255, 95, 166, .12);
}

.trend-card:hover {
    border-color: rgba(255, 95, 166, .30);
    box-shadow: 0 12px 26px -16px rgba(123, 38, 96, .55);
}
</style>
