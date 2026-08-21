<script setup lang="ts">
  import confetti from 'canvas-confetti'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  function triggerConfetti () {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#FF9A4D', '#FF5F8F', '#8B5CF6', '#FFD93D'],
      })
    } catch {
      // Ignora caso canvas não esteja disponível
    }
  }

  function goToSignup () {
    triggerConfetti()
    setTimeout(() => {
      router.push('/public/Signup')
    }, 150)
  }

  function goToExplore () {
    router.push('/public/explore')
  }
</script>

<template>
  <section class="updates-cta-section" aria-labelledby="cta-heading">
    <div class="cta-glow-backdrop" aria-hidden="true" />

    <div class="cta-container">
      <div class="cta-card-box">
        <!-- Floating Avatar Cluster -->
        <div class="cta-avatar-cluster">
          <div class="avatar-pill">
            <div class="cluster-avatars">
              <span class="user-av u1">M</span>
              <span class="user-av u2">L</span>
              <span class="user-av u3">G</span>
              <span class="user-av u4">C</span>
            </div>
            <div class="cluster-text">
              <span class="live-pulse" />
              <strong>+5.4k pessoas</strong> conectadas
            </div>
          </div>
        </div>

        <!-- Headline -->
        <h2 id="cta-heading" class="cta-title">
          As próximas histórias acontecem com
          <span class="gradient-text">você dentro delas.</span>
        </h2>

        <!-- Subtitle -->
        <p class="cta-desc">
          Descubra eventos incríveis, encontre sua galera e faça parte do que está acontecendo na rede social que conecta pessoas reais a experiências inesquecíveis.
        </p>

        <!-- CTAs -->
        <div class="cta-buttons-row">
          <button
            class="btn-cta-signup"
            type="button"
            @click="goToSignup"
            @mouseenter="triggerConfetti"
          >
            <v-icon icon="mdi-account-plus-outline" size="20" />
            <span>Criar minha conta gratuita</span>
          </button>

          <button
            class="btn-cta-explore"
            type="button"
            @click="goToExplore"
          >
            <v-icon icon="mdi-compass" size="20" />
            <span>Explorar eventos</span>
          </button>
        </div>

        <!-- Trust Badges -->
        <div class="cta-trust-strip">
          <div class="trust-item">
            <v-icon icon="mdi-check-decagram" size="16" />
            <span>100% Gratuito</span>
          </div>
          <div class="trust-item">
            <v-icon icon="mdi-lightning-bolt" size="16" />
            <span>Acesso Instantâneo</span>
          </div>
          <div class="trust-item">
            <v-icon icon="mdi-shield-lock-outline" size="16" />
            <span>Sem Spam</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.updates-cta-section {
  padding: 5rem 0 6rem;
  position: relative;
  overflow: hidden;
  background: radial-gradient(100% 100% at 50% 100%, #FFF0F4 0%, #FFFFFF 100%);
}

.cta-glow-backdrop {
  position: absolute;
  bottom: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 154, 77, 0.25) 0%, rgba(255, 95, 143, 0.15) 45%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}

.cta-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 1;
}

.cta-card-box {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 154, 77, 0.35);
  border-radius: 36px;
  padding: 4rem 2rem;
  text-align: center;
  max-width: 920px;
  margin: 0 auto;
  box-shadow: 0 20px 70px rgba(255, 95, 143, 0.12), 0 4px 16px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Avatar cluster */
.cta-avatar-cluster {
  margin-bottom: 2rem;
}

.avatar-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  background: #ffffff;
  padding: 0.4rem 1rem 0.4rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 154, 77, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.cluster-avatars {
  display: flex;
}

.user-av {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  color: white;
}

.user-av:first-child { margin-left: 0; }
.u1 { background: #ff5f8f; }
.u2 { background: #ff9a4d; }
.u3 { background: #8b5cf6; }
.u4 { background: #06b6d4; }

.cluster-text {
  font-size: 0.82rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cluster-text strong {
  color: #0f172a;
}

.live-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

/* Typography */
.cta-title {
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.15;
  letter-spacing: -0.02em;
  max-width: 760px;
  margin-bottom: 1.25rem;
}

.gradient-text {
  background: linear-gradient(135deg, #ff9a4d 0%, #ff5f8f 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}

.cta-desc {
  font-size: clamp(1.05rem, 2vw, 1.2rem);
  color: #64748b;
  line-height: 1.65;
  max-width: 620px;
  margin-bottom: 2.5rem;
}

/* Buttons */
.cta-buttons-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.btn-cta-signup {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: none;
  font-size: 1.05rem;
  font-weight: 800;
  padding: 1.1rem 2.5rem;
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(255, 95, 143, 0.4);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.btn-cta-signup:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 14px 40px rgba(255, 95, 143, 0.55);
}

.btn-cta-signup:focus-visible {
  outline: 3px solid #ff5f8f;
  outline-offset: 3px;
}

.btn-cta-explore {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(226, 232, 240, 0.9);
  font-size: 1.05rem;
  font-weight: 700;
  padding: 1.1rem 2.25rem;
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
}

.btn-cta-explore:hover {
  transform: translateY(-2px);
  border-color: #ff5f8f;
  color: #ff5f8f;
}

.btn-cta-explore:focus-visible {
  outline: 2px solid #ff5f8f;
  outline-offset: 2px;
}

/* Trust Strip */
.cta-trust-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.trust-item .v-icon {
  color: #10b981;
}

@media (max-width: 640px) {
  .cta-card-box {
    padding: 2.5rem 1.25rem;
    border-radius: 24px;
  }

  .btn-cta-signup,
  .btn-cta-explore {
    width: 100%;
    justify-content: center;
  }

  .cta-trust-strip {
    gap: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn-cta-signup,
  .btn-cta-explore {
    transition: none;
  }

  .btn-cta-signup:hover,
  .btn-cta-explore:hover {
    transform: none;
  }
}
</style>
