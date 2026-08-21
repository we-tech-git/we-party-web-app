<script setup lang="ts">
  import { useWindowScroll } from '@vueuse/core'
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const { y: scrollY } = useWindowScroll()

  const isScrolled = computed(() => scrollY.value > 20)

  function goToExplore () {
    router.push('/public/explore')
  }

  function goToSignup () {
    router.push('/public/Signup')
  }

  function goToLogin () {
    router.push('/public/Login')
  }

  function goToHome () {
    router.push('/')
  }
</script>

<template>
  <header
    class="updates-header"
    :class="{ 'header-scrolled': isScrolled }"
  >
    <div class="header-container">
      <!-- Brand Logo -->
      <div
        class="brand-logo"
        role="button"
        tabindex="0"
        aria-label="We Party - Ir para a página inicial"
        @click="goToHome"
        @keydown.enter="goToHome"
        @keydown.space.prevent="goToHome"
      >
        <img
          alt="We Party Logo"
          class="logo-img"
          src="/logoweparty.png"
        >
        <div class="brand-text-col">
          <span class="logo-title">We Party</span>
          <span class="logo-badge">Updates</span>
        </div>
      </div>

      <!-- Navigation & Action CTAs -->
      <nav class="header-actions" aria-label="Navegação do cabeçalho">
        <button
          class="btn-nav-link"
          type="button"
          @click="goToExplore"
        >
          <v-icon icon="mdi-compass-outline" size="18" />
          <span>Explorar eventos</span>
        </button>

        <button
          class="btn-nav-link btn-login"
          type="button"
          @click="goToLogin"
        >
          <span>Entrar</span>
        </button>

        <button
          class="btn-signup-glow"
          type="button"
          @click="goToSignup"
        >
          <span>Criar conta</span>
          <v-icon icon="mdi-arrow-right" size="16" />
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.updates-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1rem 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 183, 77, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-scrolled {
  padding: 0.75rem 0;
  background: rgba(255, 255, 255, 0.96);
  border-bottom-color: rgba(255, 154, 77, 0.22);
  box-shadow: 0 4px 24px rgba(255, 154, 77, 0.08);
}

.header-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

/* Brand Logo */
.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  outline: none;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
  margin: -0.25rem -0.5rem;
  transition: transform 0.25s ease;
}

.brand-logo:hover {
  transform: translateY(-1px);
}

.brand-logo:focus-visible {
  box-shadow: 0 0 0 2px #ff5f8f;
}

.logo-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(255, 95, 143, 0.3));
}

.brand-text-col {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
}

.logo-title {
  font-size: 1.45rem;
  font-weight: 800;
  font-family: 'Baloo Thambi 2', cursive;
  background: linear-gradient(135deg, #ff9a4d 0%, #ff5f8f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.01em;
}

.logo-badge {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 95, 143, 0.12);
  color: #ff5f8f;
  border: 1px solid rgba(255, 95, 143, 0.25);
}

/* Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: none;
  color: #475569;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-nav-link:hover {
  color: #ff5f8f;
  background: rgba(255, 95, 143, 0.08);
}

.btn-nav-link:focus-visible {
  outline: 2px solid #ff5f8f;
  outline-offset: 2px;
}

.btn-signup-glow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: none;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.65rem 1.4rem;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 95, 143, 0.35);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.btn-signup-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(255, 95, 143, 0.45);
}

.btn-signup-glow:focus-visible {
  outline: 2px solid #ff9a4d;
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .btn-nav-link {
    display: none;
  }

  .btn-signup-glow {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .logo-title {
    font-size: 1.25rem;
  }
}
</style>
