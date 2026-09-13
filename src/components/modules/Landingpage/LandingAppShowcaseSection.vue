<script setup lang="ts">
  // Extraído de LandingPage.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 7ª e
  // última fatia da decomposição de LandingPage.vue.
  //
  // Diferente das fatias anteriores, aqui o mockup do celular (tilt 3D ao
  // mouse, flutuação contínua, entrada animada) tem estado real (refs +
  // closures do GSAP como `badgeConfirmedX`/`phoneFloatTl`) só usado pelos
  // handlers do próprio template (`@mousemove`/`@mouseleave`). Diferente de
  // "só fazer querySelectorAll", não dava pra resolver com `landingEl`: os
  // handlers de mouse precisam dos MESMOS refs que o setup do GSAP usou. Por
  // isso, ao contrário das fatias 1-6 (que deixaram toda a inicialização no
  // pai), esta seção ficou dona do próprio `onMounted`/`onUnmounted` — um
  // mini gsap.context local, sem afetar o `ctx` do pai.
  //
  // `discoverEvents` (preview do card no tab "Detalhes do Evento") e
  // `canInstall` (banner de instalação do PWA) continuam vindo do pai via
  // prop — `usePwaInstall()` guarda `showIOSInstructions` num ref por
  // chamada (não é singleton), então chamar o composable de novo aqui
  // criaria um ref diferente do que o modal de instruções do iOS (que fica
  // no pai) observa. Por isso o clique do botão de instalar emite
  // `install-app` em vez de chamar `usePwaInstall()` de novo.
  import type { DiscoverEventCard } from './types'

  import { useWindowSize } from '@vueuse/core'
  import gsap from 'gsap'
  import { onMounted, onUnmounted, ref } from 'vue'

  defineProps<{
    discoverEvents: DiscoverEventCard[]
    canInstall: boolean
  }>()

  const emit = defineEmits<{
    'install-app': []
  }>()

  const { width: windowWidth } = useWindowSize()
  const reducedMotion = ref(false)

  // Showcase "We Party em ação" — aba ativa do mockup do celular
  const activeShowcase = ref(0)

  const appScreenshots = [
    {
      title: 'Feed de Eventos',
      description: 'Navegue por eventos próximos em tempo real, com filtros que aprendem o que você gosta.',
      image: '/Feedparty.png',
      icon: 'mdi-view-dashboard',
      color: 'var(--gradient)',
      tag: 'Descoberta',
    },
    {
      title: 'Perfil Interativo',
      description: 'Personalize seu perfil, siga amigos e acompanhe o histórico de eventos que você viveu.',
      image: '/perfilweparty.png',
      icon: 'mdi-account-circle',
      color: '#8b5cf6',
      tag: 'Social',
    },
    {
      title: 'Detalhes do Evento',
      description: 'Mapa integrado, lista de participantes e todas as informações completas do evento.',
      image: '',
      icon: 'mdi-calendar-star',
      color: '#3b82f6',
      tag: 'Informações',
    },
  ]

  // Aba "Feed de Eventos" embute o app real num iframe com viewport fixo de celular
  const FEED_EMBED_WIDTH = 390
  const phoneScreenEl = ref<HTMLElement | null>(null)
  const feedEmbedScale = ref(1)
  let phoneScreenObserver: ResizeObserver | null = null

  // No breakpoint mobile o scroll do feed acontece no html/body do próprio
  // documento embutido (não num contêiner interno), então não dá pra usar
  // scrolling="no" no iframe sem travar a navegação. Em vez disso, injeta um
  // estilo same-origin que esconde a scrollbar nativa sem desativar o scroll.
  function onFeedEmbedLoad (event: Event) {
    const iframe = event.target as HTMLIFrameElement
    try {
      const doc = iframe.contentDocument
      if (!doc || doc.querySelector('#embed-hide-scrollbar')) return

      const style = doc.createElement('style')
      style.id = 'embed-hide-scrollbar'
      style.textContent = 'html, body { scrollbar-width: none; } html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; width: 0; height: 0; }'
      doc.head.append(style)
    } catch {
      // Cross-origin (ex.: preview em domínio diferente) — sem acesso ao documento, ignora.
    }
  }

  // Smartphone 3D
  const PHONE_BASE_ROTATE_X = 3
  const PHONE_BASE_ROTATE_Y = -14
  const PHONE_TILT_RANGE_X = 3
  const PHONE_TILT_RANGE_Y = 5
  const phoneStageEl = ref<HTMLElement | null>(null)
  const phoneTiltEl = ref<HTMLElement | null>(null)
  const badgeConfirmedEl = ref<HTMLElement | null>(null)

  let badgeConfirmedX: ReturnType<typeof gsap.quickTo> | null = null
  let badgeConfirmedY: ReturnType<typeof gsap.quickTo> | null = null
  let phoneFloatTl: gsap.core.Timeline | null = null

  function setPhoneTilt (rotateX: number, rotateY: number, duration = 0.9) {
    if (!phoneTiltEl.value) return
    gsap.to(phoneTiltEl.value, { rotateX, rotateY, duration, ease: 'power3.out', overwrite: 'auto' })
  }

  function onPhonePointerMove (event: MouseEvent) {
    if (reducedMotion.value || windowWidth.value < 1024) return
    if (!phoneStageEl.value) return

    const rect = phoneStageEl.value.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    setPhoneTilt(
      PHONE_BASE_ROTATE_X - (py - 0.5) * 2 * PHONE_TILT_RANGE_X,
      PHONE_BASE_ROTATE_Y + (px - 0.5) * 2 * PHONE_TILT_RANGE_Y,
    )

    badgeConfirmedX?.((px - 0.5) * -10)
    badgeConfirmedY?.((py - 0.5) * -8)
  }

  function onPhonePointerLeave () {
    if (reducedMotion.value) return
    setPhoneTilt(PHONE_BASE_ROTATE_X, PHONE_BASE_ROTATE_Y)
    badgeConfirmedX?.(0)
    badgeConfirmedY?.(0)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMARTPHONE 3D (Refinado e Integrado)
  // ═══════════════════════════════════════════════════════════════════════════
  function initPhoneShowcase () {
    if (!phoneTiltEl.value || !phoneStageEl.value) return

    gsap.set(phoneTiltEl.value, { transformPerspective: 1600 })

    if (reducedMotion.value) {
      gsap.set(phoneTiltEl.value, { rotateX: PHONE_BASE_ROTATE_X, rotateY: PHONE_BASE_ROTATE_Y, opacity: 1 })
      gsap.set(badgeConfirmedEl.value, { opacity: 1 })
      return
    }

    gsap.set(phoneTiltEl.value, { rotateX: PHONE_BASE_ROTATE_X, rotateY: PHONE_BASE_ROTATE_Y })

    if (badgeConfirmedEl.value) {
      badgeConfirmedX = gsap.quickTo(badgeConfirmedEl.value, 'x', { duration: 1.1, ease: 'power3.out' })
      badgeConfirmedY = gsap.quickTo(badgeConfirmedEl.value, 'y', { duration: 1.1, ease: 'power3.out' })
    }

    const floatAmplitude = windowWidth.value < 768 ? 3 : 7
    phoneFloatTl = gsap.timeline({ repeat: -1, yoyo: true, paused: true, defaults: { ease: 'sine.inOut', duration: 3.6 } })
      .to(phoneTiltEl.value, { y: -floatAmplitude, rotateZ: 0.3 }, 0)
      .to('.showcase-phone-3d-shadow', { scale: 0.96, opacity: 0.7 }, 0)

    const entranceTl = gsap.timeline({
      scrollTrigger: {
        trigger: phoneStageEl.value,
        start: 'top 82%',
        toggleActions: 'play none none reverse',
        onEnter: () => {
          gsap.set(phoneTiltEl.value, { rotateY: PHONE_BASE_ROTATE_Y - 11 })
          setPhoneTilt(PHONE_BASE_ROTATE_X, PHONE_BASE_ROTATE_Y, 1.1)
        },
        onLeaveBack: () => setPhoneTilt(PHONE_BASE_ROTATE_X, PHONE_BASE_ROTATE_Y - 11, 0.6),
      },
      onComplete: () => {
        phoneFloatTl?.play()
      },
      onReverseComplete: () => {
        phoneFloatTl?.pause(0)
      },
    })

    entranceTl
      .from(phoneTiltEl.value, {
        opacity: 0, y: 60, scale: 0.92, duration: 1.1, ease: 'power3.out',
      })
      .from(badgeConfirmedEl.value, {
        opacity: 0, y: 16, scale: 0.9, duration: 0.6, ease: 'power3.out',
      }, '-=0.55')

    const phoneBodyEl = phoneTiltEl.value.querySelector('.showcase-phone-3d-body')
    if (phoneBodyEl) {
      gsap.to(phoneBodyEl, {
        scale: 1.03,
        scrollTrigger: {
          trigger: phoneStageEl.value,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
    }
  }

  onMounted(() => {
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    initPhoneShowcase()

    if (phoneScreenEl.value) {
      phoneScreenObserver = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width
        if (width) feedEmbedScale.value = width / FEED_EMBED_WIDTH
      })
      phoneScreenObserver.observe(phoneScreenEl.value)
    }
  })

  onUnmounted(() => {
    phoneScreenObserver?.disconnect()
    phoneFloatTl?.kill()
    // ScrollTriggers criados aqui (entrada do celular, parallax do corpo)
    // são revertidos junto com o resto da página pelo
    // `for (const t of ScrollTrigger.getAll()) t.kill()` do LandingPage.vue.
  })
</script>

<template>
  <section id="app-showcase" class="app-showcase-v2">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">
          Veja o <span class="logo-text">We Party</span> em ação
        </h2>
        <p class="section-description">Conheça a plataforma e descubra como é fácil explorar eventos</p>
      </div>

      <div class="showcase-grid">
        <div class="showcase-tabs">
          <button
            v-for="(screenshot, index) in appScreenshots"
            :key="screenshot.title"
            class="showcase-tab"
            :class="{ active: activeShowcase === index }"
            type="button"
            @click="activeShowcase = index"
          >
            <div class="showcase-tab-top">
              <div
                class="showcase-tab-badge"
                :style="activeShowcase === index ? { background: screenshot.color } : {}"
              >
                <v-icon :icon="screenshot.icon" size="22" />
              </div>
              <div class="showcase-tab-heading">
                <span class="showcase-tab-pill" :class="{ active: activeShowcase === index }">{{ screenshot.tag }}</span>
                <div class="showcase-tab-title">{{ screenshot.title }}</div>
              </div>
            </div>
            <p class="showcase-tab-desc">{{ screenshot.description }}</p>
          </button>
        </div>

        <div
          ref="phoneStageEl"
          class="showcase-phone-wrap"
          @mouseleave="onPhonePointerLeave"
          @mousemove="onPhonePointerMove"
        >
          <div class="showcase-phone-3d-shadow" />

          <div ref="phoneTiltEl" class="showcase-phone-3d-tilt">
            <div class="showcase-phone-3d-body">
              <div class="showcase-phone-3d-core" />

              <div class="showcase-phone-3d-face face-right">
                <span class="showcase-phone-3d-btn btn-power" />
              </div>
              <div class="showcase-phone-3d-face face-left">
                <span class="showcase-phone-3d-btn btn-vol-up" />
                <span class="showcase-phone-3d-btn btn-vol-down" />
              </div>
              <div class="showcase-phone-3d-face face-top" />
              <div class="showcase-phone-3d-face face-bottom" />

              <div class="showcase-phone-3d-face face-front">
                <div class="showcase-phone-3d-speaker">
                  <span class="showcase-phone-3d-camera" />
                </div>
                <div ref="phoneScreenEl" class="showcase-phone-3d-screen">
                  <Transition mode="out-in" name="phone-fade">
                    <div v-if="activeShowcase === 0" key="feed-embed" class="showcase-feed-embed-wrap">
                      <iframe
                        class="showcase-feed-embed"
                        loading="lazy"
                        src="/explore"
                        :style="{ transform: `scale(${feedEmbedScale})` }"
                        title="Feed de Eventos da We Party, ao vivo"
                        @load="onFeedEmbedLoad"
                      />
                    </div>
                    <div v-else-if="activeShowcase === 2" key="event-mock" class="event-mock">
                      <div class="event-mock-cover" :style="{ background: discoverEvents[0]!.gradient }">
                        <span class="event-mock-back"><v-icon icon="mdi-arrow-left" size="14" /></span>
                        <span class="event-mock-like"><v-icon icon="mdi-heart-outline" size="14" /></span>
                        <span class="event-mock-emoji">{{ discoverEvents[0]!.emoji }}</span>
                      </div>
                      <div class="event-mock-body">
                        <span class="event-mock-tag" :style="{ background: discoverEvents[0]!.tagColor }">{{ discoverEvents[0]!.tag }}</span>
                        <div class="event-mock-title">{{ discoverEvents[0]!.title }}</div>
                        <div class="event-mock-meta">
                          <span><v-icon icon="mdi-calendar-blank-outline" size="12" /> {{ discoverEvents[0]!.when }}</span>
                        </div>
                        <div class="event-mock-map">
                          <span class="event-mock-map-pin"><v-icon icon="mdi-map-marker" size="16" /></span>
                        </div>
                        <div class="event-mock-participants">
                          <div class="discover-avatars">
                            <span class="avatar-dot avatar-1" />
                            <span class="avatar-dot avatar-2" />
                            <span class="avatar-dot avatar-3" />
                          </div>
                          <span class="event-mock-participants-text">+312 confirmados</span>
                        </div>
                        <div class="event-mock-cta">
                          <v-icon icon="mdi-check-circle-outline" size="15" />
                          <span>Confirmar presença</span>
                        </div>
                      </div>
                    </div>
                    <img
                      v-else
                      :key="activeShowcase"
                      :alt="appScreenshots[activeShowcase]!.title"
                      class="showcase-phone-img"
                      :src="appScreenshots[activeShowcase]!.image"
                    >
                  </Transition>
                  <div class="showcase-phone-3d-glass" />
                </div>
              </div>
            </div>
          </div>

          <div ref="badgeConfirmedEl" class="showcase-floating-badge badge-confirmed">
            <v-icon color="#4ade80" icon="mdi-check-circle" size="16" /> Presença confirmada
          </div>
        </div>
      </div>

      <div v-if="canInstall" class="pwa-banner">
        <span class="pwa-banner-deco pwa-banner-deco-1">✨</span>
        <span class="pwa-banner-deco pwa-banner-deco-2">🎉</span>
        <div class="pwa-banner-info">
          <div class="pwa-banner-icon">📲</div>
          <div>
            <div class="pwa-banner-title">Baixe também nossa versão PWA</div>
            <div class="pwa-banner-desc">Instale direto do navegador, sem loja de apps, e leve o We Party pra onde você for.</div>
          </div>
        </div>
        <button class="btn-pwa-install" type="button" @click="emit('install-app')">
          <v-icon icon="mdi-download" size="20" />
          <span>Instalar PWA</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Duplicados de LandingPage.vue — ver comentário no <script>. */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 2;
  width: 100%;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1.25rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: 'Baloo Thambi 2', cursive;
  font-style: normal;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

h2 .logo-text,
.section-title .logo-text {
  font-size: inherit;
  display: inline;
}

.section-header {
  text-align: center;
  max-width: 750px;
  margin: 0 auto 4.5rem;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1.25rem;
  line-height: 1.3;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.section-description {
  font-size: 1.15rem;
  color: #64748b;
  line-height: 1.75;
  font-weight: 400;
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.65rem;
  }

  .section-description {
    font-size: 0.95rem;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP EM AÇÃO — MOCKUP INTERATIVO
   ═══════════════════════════════════════════════════════════════════════════ */
.app-showcase-v2 {
  padding: 8rem 0;
  position: relative;
}

.app-showcase-v2 .container {
  max-width: 1320px;
}

.showcase-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 3.5rem;
  align-items: center;
}

.showcase-tabs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.showcase-tab {
  text-align: left;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  padding: 1.35rem 1.5rem;
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  font-family: inherit;
  will-change: transform;
}

.showcase-tab.active {
  background: #fff;
  border-color: transparent;
  box-shadow: 0 16px 36px rgba(249, 120, 163, 0.22);
}

.showcase-tab-top {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.showcase-tab-badge {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.06);
  filter: grayscale(0.4) opacity(0.7);
  transition: all 0.25s ease;
}

.showcase-tab.active .showcase-tab-badge {
  filter: none;
}

.showcase-tab-heading {
  flex: 1;
  min-width: 0;
}

.showcase-tab-pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  color: #9a9aab;
}

.showcase-tab-pill.active {
  background: #fff0e8;
  color: var(--primary-dark);
}

.showcase-tab-title {
  font-weight: 800;
  font-size: 1.1rem;
  color: #1a1a2e;
  margin-top: 0.45rem;
}

.showcase-tab-desc {
  font-size: 0.87rem;
  color: var(--text-light);
  line-height: 1.6;
  margin: 0.85rem 0 0;
  padding-left: 4rem;
}

@media (max-width: 768px) {
  .showcase-tab-desc {
    padding-left: 0;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMARTPHONE 3D
   ═══════════════════════════════════════════════════════════════════════════ */
.showcase-phone-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 3rem 0 4rem;
  perspective: 1700px;
}

.showcase-phone-3d-shadow {
  position: absolute;
  left: 50%;
  bottom: 12px;
  width: 62%;
  height: 70px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center, rgba(249, 120, 163, 0.5) 0%, rgba(249, 120, 163, 0.22) 45%, rgba(249, 120, 163, 0) 75%);
  filter: blur(22px);
  z-index: 0;
  pointer-events: none;
}

.showcase-phone-3d-tilt {
  position: relative;
  z-index: 1;
  transform-style: preserve-3d;
  will-change: transform;
}

.showcase-phone-3d-body {
  position: relative;
  width: 280px;
  height: 560px;
  transform-style: preserve-3d;
  will-change: transform;
}

.showcase-phone-3d-face {
  position: absolute;
  background: linear-gradient(180deg, #26263f 0%, #101020 100%);
}

.showcase-phone-3d-core {
  position: absolute;
  inset: 0;
  border-radius: 44px;
  background: linear-gradient(180deg, #1c1c34 0%, #0b0b16 100%);
  transform: translateZ(0);
}

.face-front {
  inset: 0;
  border-radius: 44px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateZ(8px);
  background:
    radial-gradient(circle at 14% 8%, rgba(139, 92, 246, 0.2), transparent 40%),
    radial-gradient(circle at 88% 96%, rgba(249, 120, 163, 0.25), transparent 45%),
    linear-gradient(155deg, #14142a 0%, #1a1a2e 45%, #20203f 100%);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.16),
    inset 0 -1px 1px rgba(0, 0, 0, 0.4),
    0 34px 60px -12px rgba(20, 10, 30, 0.45),
    0 12px 24px -8px rgba(249, 120, 163, 0.25);
}

.face-right,
.face-left {
  width: 16px;
  height: 472px;
  top: 44px;
  left: 132px;
  border-radius: 16px;
  background: linear-gradient(90deg, #0b0b14 0%, #2c2c48 35%, #3c3c5e 50%, #2c2c48 65%, #0b0b14 100%);
}

.face-right {
  transform: rotateY(90deg) translateZ(140px);
}

.face-left {
  transform: rotateY(-90deg) translateZ(140px);
}

.face-top,
.face-bottom {
  width: 192px;
  height: 16px;
  top: 272px;
  left: 44px;
  background: linear-gradient(180deg, #26263f 0%, #101020 100%);
}

.face-top {
  transform: rotateX(90deg) translateZ(280px);
  border-radius: 44px 44px 0 0;
}

.face-bottom {
  transform: rotateX(-90deg) translateZ(280px);
  border-radius: 0 0 44px 44px;
}

.showcase-phone-3d-btn {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 3px;
  background: linear-gradient(90deg, #3a3a5c, #14141f);
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.1);
}

.btn-power {
  top: 130px;
  height: 72px;
}

.btn-vol-up {
  top: 108px;
  height: 44px;
}

.btn-vol-down {
  top: 164px;
  height: 44px;
}

.showcase-phone-3d-speaker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 22px;
  flex-shrink: 0;
}

.showcase-phone-3d-speaker::before {
  content: '';
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
}

.showcase-phone-3d-camera {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #4a4a66, #0a0a14 70%);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.showcase-phone-3d-screen {
  position: relative;
  flex: 1;
  width: 100%;
  border-radius: 32px;
  overflow: hidden;
  background: #fdeef4;
  /* .showcase-phone-3d-body/-tilt usam transform-style: preserve-3d para o
     tilt 3D do mockup. Sem isolar esta tela num contexto "flat" próprio, o
     overflow: hidden acima deixa vazar conteúdo composto separadamente
     (o iframe do feed e o v-menu teleportado do dropdown de usuário),
     que passa a ignorar os limites arredondados da tela durante o scroll.
     Mesmo com isolation/flat, Chromium ainda promove o <iframe> a uma
     camada própria e o overflow: hidden sozinho falha em recortá-la durante
     o scroll interno do feed — por isso o clip-path abaixo reforça o corte
     diretamente na GPU, contornando esse bug de composição. */
  transform-style: flat;
  isolation: isolate;
  clip-path: inset(0 round 32px);
}

.showcase-phone-3d-glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.05) 16%, rgba(255, 255, 255, 0) 34%, rgba(255, 255, 255, 0) 64%, rgba(255, 255, 255, 0.05) 84%, rgba(255, 255, 255, 0.14) 100%);
  mix-blend-mode: overlay;
  opacity: 0.6;
}

.showcase-phone-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}

/* Duplicado de LandingPage.vue — só o preview do tab "Detalhes do Evento"
   (abaixo) ainda usava; parent removeu a própria cópia na Fase 5 parte 7. */
.discover-avatars {
  display: flex;
  align-items: center;
}

.avatar-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #fff8f0;
  margin-left: -10px;
  display: inline-block;
}

.avatar-dot:first-child {
  margin-left: 0;
}

.avatar-1 {
  background: linear-gradient(135deg, #ffb27a, #F978A3);
}

.avatar-2 {
  background: linear-gradient(135deg, #ff9a9a, #c48bff);
}

.avatar-3 {
  background: linear-gradient(135deg, #8bd3ff, #a58bff);
}

.event-mock {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.event-mock-cover {
  position: relative;
  flex-shrink: 0;
  height: 40%;
  min-height: 130px;
}

.event-mock-back,
.event-mock-like {
  position: absolute;
  top: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-mock-back {
  left: 12px;
}

.event-mock-like {
  right: 12px;
}

.event-mock-emoji {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.6rem;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.15));
}

.event-mock-body {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-mock-tag {
  align-self: flex-start;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}

.event-mock-title {
  font-weight: 800;
  font-size: 15px;
  line-height: 1.25;
  color: var(--text-dark);
}

.event-mock-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-light);
}

.event-mock-map {
  position: relative;
  height: 76px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle, rgba(139, 92, 246, 0.16) 1px, transparent 1px) 0 0 / 14px 14px,
    linear-gradient(135deg, #e9f4ff 0%, #f3edff 100%);
}

.event-mock-map-pin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(249, 120, 163, 0.4);
}

.event-mock-participants {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-mock-participants-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-dark);
}

.event-mock-cta {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #fff;
  font-weight: 700;
  font-size: 12.5px;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.3);
}

.showcase-feed-embed-wrap {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  clip-path: inset(0);
}

.showcase-feed-embed {
  width: 390px;
  height: 844px;
  border: none;
  transform-origin: top left;
}

.phone-fade-enter-active,
.phone-fade-leave-active {
  transition: opacity 0.3s ease;
}

.phone-fade-enter-from,
.phone-fade-leave-to {
  opacity: 0;
}

.showcase-floating-badge {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border-radius: 16px;
  padding: 0.7rem 1.1rem;
  box-shadow: 0 16px 34px -6px rgba(249, 120, 163, 0.3), 0 2px 6px rgba(26, 26, 46, 0.06);
  font-size: 0.8rem;
  font-weight: 700;
  color: #1a1a2e;
  will-change: transform;
}

.badge-confirmed {
  bottom: 14%;
  right: -6%;
}

@media (max-width: 1024px) {
  .showcase-grid {
    grid-template-columns: 1fr;
  }

  .showcase-phone-wrap {
    perspective: 1300px;
    padding: 2.5rem 0 3.5rem;
  }

  .badge-confirmed {
    right: 4%;
  }
}

@media (max-width: 768px) {
  .app-showcase-v2 {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }

  .showcase-phone-3d-body {
    width: 240px;
    height: 480px;
  }

  .face-right,
  .face-left {
    height: 392px;
    top: 44px;
    left: 112px;
  }

  .face-right {
    transform: rotateY(90deg) translateZ(120px);
  }

  .face-left {
    transform: rotateY(-90deg) translateZ(120px);
  }

  .face-top,
  .face-bottom {
    width: 152px;
    top: 232px;
    left: 44px;
  }

  .face-top {
    transform: rotateX(90deg) translateZ(240px);
  }

  .face-bottom {
    transform: rotateX(-90deg) translateZ(240px);
  }

  .badge-confirmed {
    display: none;
  }
}

@media (max-width: 480px) {
  .showcase-phone-wrap {
    perspective: 900px;
    padding: 1.5rem 0 2.5rem;
  }

  .showcase-phone-3d-shadow {
    height: 46px;
    filter: blur(16px);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PWA BANNER
   ═══════════════════════════════════════════════════════════════════════════ */
.pwa-banner {
  margin-top: 5rem;
  background: linear-gradient(120deg, var(--dark) 0%, #33244d 60%, #4a2650 100%);
  border-radius: 28px;
  padding: 2.75rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2.5rem;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.pwa-banner-deco {
  position: absolute;
  opacity: 0.08;
  pointer-events: none;
}

.pwa-banner-deco-1 {
  left: -20px;
  top: -30px;
  font-size: 130px;
}

.pwa-banner-deco-2 {
  right: 10%;
  bottom: -20px;
  font-size: 90px;
}

.pwa-banner-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  text-align: left;
  position: relative;
  z-index: 1;
}

.pwa-banner-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 20px;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  box-shadow: 0 12px 30px rgba(249, 120, 163, 0.35);
}

.pwa-banner-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.4rem;
}

.pwa-banner-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
}

.btn-pwa-install {
  background: #fff;
  color: var(--dark);
  font-family: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.95rem 2rem;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  will-change: transform;
}

.btn-pwa-install:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
}

/* Duplicado de LandingPage.vue — regra global de prefers-reduced-motion,
   mas só essas 2 classes são exclusivas desta seção. */
@media (prefers-reduced-motion: reduce) {
  .showcase-phone-3d-tilt,
  .showcase-phone-3d-shadow {
    transition: none;
    animation: none;
  }
}

@media (max-width: 1024px) {
  .pwa-banner {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .btn-pwa-install {
    align-self: stretch;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .pwa-banner-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>
