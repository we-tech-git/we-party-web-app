<script setup lang="ts">
  import confetti from 'canvas-confetti'
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  const props = withDefaults(defineProps<{ continueTo?: string }>(), {
    continueTo: '/',
  })

  const { t } = useI18n()
  const router = useRouter()
  const confettiColors = ['#FFC947', '#F978A3', '#FF629F', '#22C55E', '#FFFFFF'] as const
  let confettiInterval: number | undefined
  const confettiCount = ref(0)

  function launchConfettiBurst () {
    if (confettiCount.value >= 5) {
      if (confettiInterval) {
        window.clearInterval(confettiInterval)
        confettiInterval = undefined
      }
      return
    }

    const base = {
      particleCount: 50,
      startVelocity: 65,
      spread: 80,
      ticks: 240,
      gravity: 0.9,
      scalar: 0.9,
      colors: [...confettiColors],
      angle: 90,
      zIndex: 9999,
    }

    const lanes = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95]

    for (const xPos of lanes) {
      confetti({
        ...base,
        particleCount: base.particleCount + Math.round(Math.random() * 20),
        startVelocity: base.startVelocity + Math.random() * 10,
        scalar: base.scalar + (Math.random() - 0.5) * 0.3,
        drift: (Math.random() - 0.5) * 2,
        origin: {
          x: xPos,
          y: 0.98,
        },
      })
    }

    confetti({
      ...base,
      particleCount: 80,
      startVelocity: 75,
      spread: 120,
      scalar: 1.1,
      origin: { x: Math.random(), y: 0.98 },
    })
    confettiCount.value++
  }

  function handleContinue () {
    router.push(props.continueTo)
  }

  onMounted(() => {
    launchConfettiBurst()
    confettiInterval = window.setInterval(launchConfettiBurst, 1800)
  })

  onBeforeUnmount(() => {
    if (confettiInterval) {
      window.clearInterval(confettiInterval)
      confettiInterval = undefined
    }
    confetti.reset()
  })
</script>

<template>
  <section class="congratulations">
    <div class="content">
      <div aria-hidden="true" class="icon" role="presentation">
        <img alt="" class="success-gif" src="/Trophy.gif">
      </div>
      <h1 class="title">
        {{ t('congratulations.title') }}
      </h1>
      <p class="subtitle">
        {{ t('congratulations.description') }}
      </p>
      <button class="continue-btn" type="button" @click="handleContinue">
        {{ t('congratulations.button') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.congratulations {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 2rem 1.5rem;
  font-family: 'Poppins', sans-serif;
  text-align: center;
}

.content {
  width: 100%;
  max-width: 420px;
  display: grid;
  gap: 1.5rem;
  justify-items: center;
}

.icon {
  display: flex;
  justify-content: center;
}

.success-gif {
  width: clamp(160px, 24vw, 220px);
  aspect-ratio: 1;
  object-fit: contain;
}

.title {
  font-size: clamp(1.75rem, 2.2vw + 1rem, 2.4rem);
  font-weight: 700;
  color: #111827;
  white-space: normal;
}

.subtitle {
  color: #6B7280;
  font-size: 1rem;
  line-height: 1.6;
}

.continue-btn {
  padding: 1.2rem;
  width: 100%;
  max-width: 320px;
  border-radius: 999px;
  border: none;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  box-shadow: 0 12px 24px rgba(255, 95, 166, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(255, 95, 166, 0.32);
}

.continue-btn:active {
  transform: translateY(0);
  box-shadow: 0 10px 20px rgba(255, 95, 166, 0.25);
}

@media (max-width: 480px) {
  .content {
    gap: 1.25rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .continue-btn {
    padding: 1.2rem;
  }
}
</style>
