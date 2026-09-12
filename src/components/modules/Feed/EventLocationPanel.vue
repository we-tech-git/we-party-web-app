<script setup lang="ts">
  // Extraído de NewEventDetails.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 3ª
  // fatia da decomposição do mega-arquivo. Aba "Local" (mapa do Google Maps
  // + endereço + botão "Como chegar"), autocontida.
  //
  // `.card`/`.card-header`/`.card-icon` são compartilhadas com a aba
  // "Informações" (ainda não extraída, é a maior/mais acoplada do
  // arquivo) — duplicadas de propósito.
  import { computed } from 'vue'

  const props = defineProps<{
    venue: string
    city: string
    location: string
  }>()

  // Mesma lógica da tela antiga: usa o Embed API quando há chave; senão,
  // fallback público.
  const mapEmbedUrl = computed(() => {
    const loc = props.location || props.venue
    if (!loc) return ''
    const encoded = encodeURIComponent(loc)
    const apiKey = import.meta.env.VITE__GOOGLE_MAPS_API_KEY
    if (apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encoded}&zoom=15`
    }
    return `https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  })

  function openMap () {
    const loc = props.location || props.venue
    if (!loc) return
    const query = encodeURIComponent(loc)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer')
  }
</script>

<template>
  <div class="card">
    <div class="card-header">
      <span class="card-icon bg-pink-50 text-weparty-pink">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          viewBox="0 0 24 24"
        >
          <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </span>
      <h3>Onde acontece</h3>
    </div>
    <!-- Mapa real (Google Maps), igual à tela de detalhes antiga -->
    <div class="relative h-56 rounded-2xl overflow-hidden border border-black/5 bg-[#f1f3f9]">
      <iframe
        v-if="mapEmbedUrl"
        allowfullscreen
        class="w-full h-full"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        :src="mapEmbedUrl"
        style="border:0"
        title="Mapa do local do evento"
      />
      <div v-else class="absolute inset-0 grid place-items-center text-gray-400 font-semibold text-sm">
        Localização não disponível
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-4 mt-4">
      <span
        class="w-11 h-11 rounded-[13px] bg-pink-50 text-weparty-pink grid place-items-center flex-none"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          viewBox="0 0 24 24"
        >
          <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </span>
      <div class="min-w-0">
        <b class="text-[15px]">{{ venue }}</b>
        <small class="block text-gray-400 font-semibold">{{ city }}, PR ·
          Brasil</small>
      </div>
      <button
        class="btn-soft ml-auto flex-none flex items-center gap-2 rounded-2xl px-4 py-2.5 font-extrabold text-sm transition-all hover:-translate-y-0.5"
        @click="openMap"
      >
        Como chegar →
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Duplicado de NewEventDetails.vue — classes-base usadas pela aba
   "Informações" (ainda não extraída) e por outras seções. */
.text-weparty-pink {
    color: #ff5fa6;
}

.bg-pink-50 {
    background: #fdf2f8;
}

.btn-soft {
    background: #fff0f6;
    color: #ff5fa6;
    border: 1px solid #ffd9e6;
}

.btn-soft:hover {
    background: #ffe3ef;
    box-shadow: 0 8px 20px -12px rgba(255, 95, 166, 0.6);
}

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
