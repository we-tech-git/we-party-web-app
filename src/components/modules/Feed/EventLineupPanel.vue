<script setup lang="ts">
  // Extraído de NewEventDetails.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 4ª
  // fatia da decomposição do mega-arquivo. Aba "Atrações" (grid de
  // artistas/atrações confirmadas), puramente de exibição.
  //
  // `.card`/`.card-header`/`.card-icon` são compartilhadas com a aba
  // "Informações" (ainda não extraída) — duplicadas de propósito.
  interface LineupItem { name: string, role: string, emoji: string }

  defineProps<{
    lineup: LineupItem[]
  }>()
</script>

<template>
  <div class="card">
    <div class="card-header">
      <span class="card-icon bg-violet-50 text-violet-600">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          viewBox="0 0 24 24"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </span>
      <h3>Atrações <span class="text-gray-400 font-semibold text-sm">· {{ lineup.length
      }} confirmadas</span></h3>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-1">
      <div
        v-for="artist in lineup"
        :key="artist.name"
        class="bg-white border border-black/5 rounded-[18px] overflow-hidden shadow-sm hover:-translate-y-1 transition-all cursor-pointer"
      >
        <div
          class="h-28 grid place-items-center text-white/85 text-4xl"
          style="background: linear-gradient(135deg,#3a1430,#5b2167)"
        >{{ artist.emoji }}
        </div>
        <div class="p-4 min-w-0">
          <b class="text-[15px] block truncate">{{ artist.name }}</b>
          <small class="block text-gray-400 font-semibold truncate">{{ artist.role }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Duplicado de NewEventDetails.vue — classes-base usadas pela aba
   "Informações" (ainda não extraída) e por outras seções. */
.card {
    background: #fff;
    border: 1px solid rgba(34, 26, 61, .06);
    border-radius: 22px;
    padding: 22px 24px;
    box-shadow: 0 6px 20px -12px rgba(123, 38, 96, .3);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
}

.card-header h3 {
    font-family: 'Poppins', sans-serif;
    font-size: 18px;
    font-weight: 700;
}

.card-icon {
    width: 40px;
    height: 40px;
    border-radius: 13px;
    display: grid;
    place-items: center;
    flex: none;
}
</style>
