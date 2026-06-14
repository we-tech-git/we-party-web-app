<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

  const props = withDefaults(
    defineProps<{
      // Mensagens que vão alternando embaixo do logo (ex.: "Carregando interesses...")
      messages?: string[]
      // Intervalo (ms) de troca entre as mensagens
      interval?: number
      // Cobre a tela inteira (overlay fixo) — padrão para carregamento de página
      fullscreen?: boolean
    }>(),
    {
      // Genérico por padrão; cada página deve passar mensagens que façam sentido
      messages: () => ['Carregando...'],
      interval: 1600,
      fullscreen: true,
    },
  )

  const index = ref(0)
  const currentMessage = computed(() => props.messages[index.value] ?? '')

  let timer: ReturnType<typeof setInterval> | undefined
  function startCycle () {
    stopCycle()
    if (props.messages.length <= 1) return
    timer = setInterval(() => {
      index.value = (index.value + 1) % props.messages.length
    }, props.interval)
  }
  function stopCycle () {
    if (timer) clearInterval(timer)
    timer = undefined
  }

  onMounted(startCycle)
  onUnmounted(stopCycle)
  // Reinicia o ciclo caso a lista de mensagens mude em runtime
  watch(() => props.messages, () => {
    index.value = 0
    startCycle()
  })
</script>

<template>
  <div
    aria-live="polite"
    :class="[
      'wp-loader flex flex-col items-center justify-center gap-5',
      fullscreen ? 'fixed inset-0 z-60' : 'w-full py-10',
    ]"
    role="status"
    :style="fullscreen ? { background: 'radial-gradient(900px 600px at 88% 30%, #FFE3CB 0%, transparent 55%), radial-gradient(900px 700px at 4% 40%, #FFD7E7 0%, transparent 50%), #FFF4F7' } : undefined"
  >
    <!-- Logo pulsando -->
    <div class="wp-logo-wrapper">
      <img
        alt="We Party"
        class="wp-logo"
        src="/logoweparty.png"
      >
    </div>

    <!-- Nome da marca -->
    <span class="wp-brand notranslate" translate="no">WE PARTY</span>

    <!-- Mensagem dinâmica de carregamento -->
    <Transition mode="out-in" name="wp-msg">
      <span :key="currentMessage" class="wp-message">{{ currentMessage }}</span>
    </Transition>
  </div>
</template>

<style scoped>
.wp-logo-wrapper {
  display: grid;
  place-items: center;
}

.wp-logo {
  width: 96px;
  height: 96px;
  object-fit: contain;
  /* Sombra fixa — fica visível mesmo se a animação estiver desativada */
  filter: drop-shadow(0 8px 22px rgba(255, 95, 166, 0.45));
  /* !important sobrepõe a regra global de prefers-reduced-motion (css-variables.css):
     o pulse é o indicador de carregamento, então deve rodar sempre. */
  animation: wp-pulse 1.4s ease-in-out infinite !important;
  will-change: transform;
}

@keyframes wp-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.14);
  }
}

.wp-brand {
  /* Mesma fonte/gradiente do header (.brand-title) */
  font-family: "Baloo Thambi 2", serif;
  font-weight: 800;
  font-size: 2rem;
  line-height: 1;
  white-space: nowrap;
  background: linear-gradient(90deg, #ffba4b 0%, #ff5fa6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  /* Sombra suave rosa pra dar profundidade */
  filter: drop-shadow(0 4px 12px rgba(255, 95, 166, 0.35));
}

.wp-message {
  font-weight: 600;
  font-size: 14px;
  color: #8a7c8f;
  min-height: 1.25rem;
}

/* Transição suave entre as mensagens */
.wp-msg-enter-active,
.wp-msg-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.wp-msg-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.wp-msg-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
