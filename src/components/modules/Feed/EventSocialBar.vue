<script setup lang="ts">
  // Extraído de NewEventDetails.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 5ª
  // fatia da decomposição do mega-arquivo. Barra flutuante com avatares de
  // quem vai + contadores de curtidas/confirmados, logo abaixo do hero.
  // Puramente de exibição — `attendeeAvatars`/`goingCount`/`likeCount`
  // continuam no pai porque são lidos também pelo hero, pelo card de ação
  // e pela barra inferior mobile (nenhuma dessas seções foi extraída
  // ainda, todas compartilham os mesmos valores computados).
  interface AvatarVM { initial: string, color: string, image: string, name: string, rawUser?: any }

  defineProps<{
    attendeeAvatars: AvatarVM[]
    goingCount: number
    likeCount: number
  }>()
</script>

<template>
  <!-- Floating social bar -->
  <div
    class="relative z-10 -mt-10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-6 bg-white border border-black/5 rounded-3xl px-5 py-5 sm:px-6 shadow-card"
  >
    <div class="flex items-center gap-3 sm:gap-4">
      <div class="flex items-center">
        <div
          v-for="(av, i) in attendeeAvatars"
          :key="i"
          :style="{ marginLeft: i > 0 ? '-12px' : '0', zIndex: attendeeAvatars.length - i }"
        >
          <UserAvatar
            :image="av.image"
            :name="av.name"
            :size="40"
            :style="{ border: '2.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }"
          />
        </div>
      </div>

      <div class="leading-tight">
        <span class="font-bold"><b class="text-weparty-pink">{{ goingCount }}</b> pessoas vão</span>
        <small class="block text-gray-400 font-semibold text-sm">Confirme e chame a galera 🎉</small>
      </div>
    </div>

    <div class="hidden sm:block w-px self-stretch bg-black/8 my-1" />

    <div class="flex items-center gap-5 sm:gap-6">
      <div class="flex items-center gap-3">
        <span class="w-11 h-11 rounded-[13px] bg-pink-50 text-weparty-pink grid place-items-center flex-none">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 21s-7.5-4.6-10-9C.6 9 2 5 5.5 5 8 5 9.4 6.6 12 9c2.6-2.4 4-4 6.5-4C22 5 23.4 9 22 12c-2.5 4.4-10 9-10 9z"
            />
          </svg>
        </span>
        <div>
          <b class="text-[19px] font-display">{{ likeCount }}</b>
          <small class="block text-gray-400 font-semibold text-xs -mt-0.5">curtidas</small>
        </div>
      </div>

      <div class="w-px self-stretch bg-black/8 my-1" />

      <div class="flex items-center gap-3">
        <span class="w-11 h-11 rounded-[13px] bg-emerald-50 text-emerald-600 grid place-items-center flex-none">
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            viewBox="0 0 24 24"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <div>
          <b class="text-[19px] font-display">{{ goingCount }}</b>
          <small class="block text-gray-400 font-semibold text-xs -mt-0.5">confirmados</small>
        </div>
      </div>
    </div>
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

.shadow-card {
    box-shadow: 0 18px 50px -22px rgba(123, 38, 96, .35);
}
</style>
