<script setup lang="ts">
  import type { FeedItem } from '@/stores/events'
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useEventImages } from '@/composables/useEventImages'
  import { useGuestMode } from '@/composables/useGuestMode'
  import { useShareStore } from '@/stores/share'
  import { svgIcons } from '@/utils/svgSet'
  import InlineComments from './InlineComments.vue'

  const props = defineProps<{
    id: string | number
    banner: string
    hostName: string
    hostAvatar: string
    title: string
    description: string
    schedule: string
    eventData: FeedItem
    location?: string
    confirmed: number
    interested: number
    isSaved?: boolean
    likes?: number
    liked?: boolean
    highlight?: boolean
    rank?: number
    interests?: string[]
    commentsCount?: number
    matchedInterests?: string[]
    guestMode?: boolean
    sourceUrl?: string
    showRemoveButton?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'toggle-save' | 'toggle-like' | 'remove-favorite'): void
  }>()

  const router = useRouter()
  const { requireLogin } = useGuestMode()

  /**
   * Navega para detalhes do evento
   * Em modo guest, mostra dialog de login
   */
  function handleDetailsClick () {
    if (props.guestMode) {
      requireLogin('ver detalhes do evento')
      return
    }

    // Sempre navega para a página interna de detalhes
    router.push(`/private/event/${props.id}`)
  }

  /**
   * Intercepta ações que precisam de autenticação no modo guest
   */
  function handleProtectedAction (action: () => void, actionName: string) {
    if (props.guestMode) {
      requireLogin(actionName)
      return
    }
    action()
  }

  function handleToggleLike () {
    handleProtectedAction(() => emit('toggle-like'), 'curtir eventos')
  }

  function handleToggleSave () {
    handleProtectedAction(() => emit('toggle-save'), 'salvar eventos')
  }

  function handleRemoveFavorite (e: Event) {
    e.stopPropagation()
    emit('remove-favorite')
  }

  function handleCommentsToggle () {
    if (props.guestMode) {
      requireLogin('ver e publicar comentários')
      return
    }
    showComments.value = !showComments.value
    showInterests.value = false
  }

  function formatCount (value: number | undefined | null): string {
    const num = Number(value) || 0
    if (num < 1000) return num.toString()
    const rounded = num / 1000
    const formatted = rounded % 1 === 0 ? Math.trunc(rounded).toString() : rounded.toFixed(1)
    return `${formatted}k`
  }

  function resolveAsset (val?: string) {
    if (!val) return ''
    if (/^https?:\/\//i.test(val)) return val
    const base = (import.meta.env.VITE__BASE_URL || '').replace(/\/$/, '')
    const path = val.startsWith('/') ? val : `/${val}`
    return `${base}${path}`
  }

  const bannerSrc = computed(() => {
    return resolveAsset(props.banner)
  })

  const hostAvatarSrc = computed(() => resolveAsset(props.hostAvatar))

  const hostInitial = computed(() => (props.hostName || 'U').charAt(0).toUpperCase())

  const avatarColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
  ]

  const avatarColor = computed(() => {
    if (!props.hostName) return avatarColors[0]
    let hash = 0
    for (let i = 0; i < props.hostName.length; i++) {
      hash = (props.hostName.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash % avatarColors.length)]
  })

  const eventImages = useEventImages(() => props.eventData?.images)

  const shareStore = useShareStore()

  const showComments = ref(false)
  const showInterests = ref(false)
  const localCommentsCount = ref(props.commentsCount ?? 0)

  watch(() => props.commentsCount, val => {
    if (val !== undefined) localCommentsCount.value = val
  })

  function handleUpdateCommentsCount (count: number) {
    localCommentsCount.value = count
  }

  function handleShare () {
    shareStore.open({
      title: props.title,
      text: 'Veja esse evento que encontrei que você também pode gostar',
      url: `${window.location.origin}/private/event/${props.id}`,
    })
  }

  function toggleInterests (e: Event) {
    e.stopPropagation()
    showInterests.value = !showInterests.value
    if (showInterests.value) showComments.value = false
  }

  // Tags de interesses visíveis no card (max 3 + overflow)
  const visibleInterestTags = computed(() => {
    if (!props.interests || props.interests.length === 0) return []
    const matched = props.matchedInterests || []
    // Prioriza os matched no topo
    const sorted = [...props.interests].toSorted((a, b) => {
      const aMatch = matched.some(m => m.toLowerCase() === a.toLowerCase())
      const bMatch = matched.some(m => m.toLowerCase() === b.toLowerCase())
      if (aMatch && !bMatch) return -1
      if (!aMatch && bMatch) return 1
      return 0
    })
    return sorted.slice(0, 3)
  })

  const overflowCount = computed(() => {
    if (!props.interests) return 0
    return Math.max(0, props.interests.length - 3)
  })

  function isMatchedInterest (tag: string): boolean {
    if (!props.matchedInterests || props.matchedInterests.length === 0) return false
    return props.matchedInterests.some(m => m.toLowerCase() === tag.toLowerCase())
  }
</script>

<template>
  <article class="feed-card" :class="{ 'highlight-card': highlight }">
    <div v-if="highlight && rank" class="rank-badge">
      <span>#</span>{{ rank }}
    </div>

    <figure class="media" :class="{ 'comments-open': showComments }">
      <!-- Banner Image -->
      <img
        v-if="eventImages.desktop || bannerSrc"
        :alt="title"
        class="banner"
        loading="lazy"
        :src="eventImages.desktop || bannerSrc"
      >
      <div v-else class="banner-placeholder">
        <i class="mdi mdi-image-off-outline" />
        <span>Imagem indisponível</span>
      </div>

      <!-- Gradient layers -->
      <div class="gradient-vignette" />
      <div class="gradient-bottom" />

      <!-- Host tag -->
      <div class="host-tag">
        <template v-if="hostAvatarSrc">
          <img :alt="hostName" class="host-avatar" loading="lazy" :src="hostAvatarSrc">
        </template>
        <template v-else>
          <div class="host-avatar placeholder" :style="{ backgroundColor: avatarColor }">
            {{ hostInitial }}
          </div>
        </template>
        <span>{{ hostName }}</span>
      </div>

      <!-- Bookmark -->
      <button
        aria-label="Salvar evento"
        class="bookmark"
        :class="{ saved: isSaved }"
        type="button"
        @click.stop="handleToggleSave"
      >
        <svg
          aria-hidden="true"
          :fill="isSaved ? 'currentColor' : 'none'"
          height="20"
          role="presentation"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="20"
        >
          <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
        </svg>
        <v-tooltip activator="parent" content-class="feed-card-tooltip" location="start" offset="10">
          Favoritar
        </v-tooltip>
      </button>

      <!-- Remove from Favorites Button -->
      <button
        v-if="showRemoveButton"
        aria-label="Remover dos favoritos"
        class="remove-favorite-btn"
        type="button"
        @click.stop="handleRemoveFavorite"
      >
        <svg
          fill="none"
          height="18"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" x2="9" y1="9" y2="15" />
          <line x1="9" x2="15" y1="9" y2="15" />
        </svg>
        <v-tooltip activator="parent" content-class="feed-card-tooltip" location="start" offset="10">
          Remover dos favoritos
        </v-tooltip>
      </button>

      <!-- Interests slide-up panel -->
      <Transition name="interests-slide">
        <div v-if="showInterests && interests && interests.length > 0" class="interests-panel" @click.stop>
          <div class="interests-panel-header">
            <span class="interests-panel-title">Interesses do evento</span>
            <button
              aria-label="Fechar painel de interesses"
              class="interests-close"
              type="button"
              @click.stop="showInterests = false"
            >
              <svg
                aria-hidden="true"
                fill="none"
                focusable="false"
                height="14"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                width="14"
              >
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>
          </div>
          <div class="interests-chips-grid">
            <span v-for="tag in interests" :key="tag" class="interest-chip">
              {{ tag }}
            </span>
          </div>
        </div>
      </Transition>

      <!-- Main overlay content -->
      <figcaption class="overlay">

        <div class="container-main-card-info">
          <!-- Title -->
          <h3 class="title">{{ title }}</h3>

          <div class="container-card-info">
            <!-- Interest tags -->
            <div v-if="visibleInterestTags.length > 0" class="interest-tags">
              <span
                v-for="tag in visibleInterestTags"
                :key="tag"
                class="interest-tag"
                :class="{ matched: isMatchedInterest(tag) }"
              >{{ tag }}</span>
              <span v-if="overflowCount > 0" class="interest-tag more">+{{ overflowCount }}</span>
            </div>

            <!-- Date + Location pill -->
            <div class="meta-wrapper">
              <!-- Ícone decorativo: informação já transmitida pelo texto ao lado -->
              <svg
                aria-hidden="true"
                fill="none"
                focusable="false"
                height="13"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="13"
              >
                <rect
                  height="18"
                  rx="2"
                  ry="2"
                  width="18"
                  x="3"
                  y="4"
                />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span class="schedule">{{ schedule }}</span>
            </div>

            <div class="meta-wrapper">
              <template v-if="location">
                <!-- Ícone decorativo: informação já transmitida pelo texto ao lado -->
                <svg
                  aria-hidden="true"
                  fill="none"
                  focusable="false"
                  height="12"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="12"
                >
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span class="location">{{ location }}</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Footer: stats + actions -->
        <footer class="footer">
          <div aria-label="Indicadores do evento" class="stats">
            <button
              :aria-label="`${liked ? 'Descurtir' : 'Curtir'} evento — ${formatCount(likes)} curtidas`"
              :aria-pressed="liked"
              class="stat stat-action"
              :class="{ liked }"
              type="button"
              @click.stop="handleToggleLike"
            >
              <svg
                aria-hidden="true"
                :fill="liked ? 'currentColor' : 'none'"
                height="17"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="17"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                />
              </svg>
              <span aria-hidden="true">{{ formatCount(likes) }}</span>
            </button>
            <button
              aria-label="Comentários"
              class="stat stat-action comments-action"
              :class="{ active: showComments }"
              type="button"
              @click.stop="handleCommentsToggle"
            >
              <svg
                fill="none"
                height="17"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="17"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {{ formatCount(localCommentsCount) }}
            </button>

            <!-- Interests toggle button -->
            <button
              v-if="interests && interests.length > 0"
              aria-label="Ver interesses"
              class="stat stat-action interests-action"
              :class="{ active: showInterests }"
              type="button"
              @click="toggleInterests"
            >
              <svg
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" x2="7.01" y1="7" y2="7" />
              </svg>
              {{ interests.length }}
            </button>
          </div>

          <div class="actions">
            <button aria-label="Ver detalhes" class="icon-button" type="button" @click.stop="handleDetailsClick">
              <svg
                v-if="svgIcons.infoIcon"
                fill="none"
                height="18"
                viewBox="0 0 256 256"
                width="18"
              >
                <path
                  v-for="(path, index) in svgIcons.infoIcon.paths"
                  :key="index"
                  :d="path.d"
                  fill="#ffffff"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                />
              </svg>
              <v-tooltip
                activator="parent"
                content-class="feed-card-tooltip"
                location="top"
                offset="10"
              >Detalhes</v-tooltip>
            </button>
            <button aria-label="Compartilhar" class="icon-button" type="button" @click.prevent="handleShare">
              <svg
                v-if="svgIcons.shareIcon"
                fill="none"
                height="18"
                viewBox="0 0 256 256"
                width="18"
              >
                <path
                  v-for="(path, index) in svgIcons.shareIcon.paths"
                  :key="index"
                  :d="path.d"
                  fill="#ffffff"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                />
              </svg>
              <v-tooltip
                activator="parent"
                content-class="feed-card-tooltip"
                location="top"
                offset="10"
              >Compartilhar</v-tooltip>
            </button>
          </div>
        </footer>
      </figcaption>
    </figure>

    <InlineComments :event-id="id" :visible="showComments" @update:count="handleUpdateCommentsCount" />
  </article>
</template>

<style scoped>
/* Tooltips do Vuetify via :deep() — permanece escopado ao feed-card,
   sem poluir o namespace CSS global do projeto */
:deep(.v-overlay__content.feed-card-tooltip) {
  background: rgba(14, 20, 38, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.13);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffba4b;
}

@media (max-width: 768px) {
  :deep(.v-overlay__content.feed-card-tooltip) {
    backdrop-filter: blur(4px);
    background: rgba(14, 20, 38, 0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.v-overlay__content.feed-card-tooltip) {
    backdrop-filter: none;
    background: rgba(14, 20, 38, 0.98);
  }
}
</style>

<style scoped>
.container-main-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
  width: 100%;
}

.container-card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
  width: 100%;
}

@media (min-width: 641px) {
  .container-main-card-info {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }

  .container-card-info {
    flex-direction: column;
    margin: 0 0 0 auto;
    width: auto;
    align-items: flex-end;
  }
}

/* ─── CSS variable defaults ─────────────────────────────────────────────── */
.feed-card {
  --accent: #ff5fa6;
  --accent-light: #ffba4b;
  --accent-rgb: 255, 95, 166;
  --accent-light-rgb: 255, 186, 75;
}

/* ─── Card shell ─────────────────────────────────────────────────────────── */
.feed-card {
  position: relative;
  border-radius: 28px;
  overflow: visible;
  background: #fff5f76e;
  isolation: isolate;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  padding: 0.35rem;
  width: 100%;
  max-width: 100%;
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
  z-index: 1;
}

/* Highlight cards mantêm fundo escuro — coberto pelo glow gradiente do ::before */
.feed-card.highlight-card {
  background: #07091a;
}

.feed-card:hover {
  transform: translateY(-6px) translateZ(0);
}

.feed-card:not(:hover) {
  will-change: auto;
}

/* Highlight card */
.feed-card.highlight-card {
}

.feed-card.highlight-card::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -1;
  background: linear-gradient(135deg, var(--accent-light), var(--accent), #9C27B0);
  border-radius: 30px;
  opacity: 0.55;
  transition: opacity 0.3s ease;
}

.feed-card.highlight-card:hover::before {
  opacity: 0.9;
}

/* Rank badge */
.rank-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 50;
  width: 52px;
  height: 52px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%);
  color: #fff;
  font-weight: 800;
  font-size: 1.65rem;
  border-radius: 18px;
  transform: rotate(-10deg);
  border: 2px solid rgba(255, 255, 255, 0.25);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rank-badge span {
  font-size: 0.9rem;
  opacity: 0.75;
  vertical-align: top;
  margin-top: -7px;
  margin-right: 1px;
}

.feed-card.highlight-card:hover .rank-badge {
  transform: rotate(0deg) scale(1.1);
}

/* Push host-tag right so it doesn't overlap the rank badge (52px wide + 12px left + 8px gap) */
.feed-card.highlight-card .host-tag {
  left: 72px;
}

/* ─── Media ──────────────────────────────────────────────────────────────── */
.media {
  position: relative;
  margin: 0;
  /* Garante altura mínima para evitar colapso */
  min-height: 380px;
  /* Sem height: 100% — senão a figure estica para preencher o card quando os
     comentários expandem abaixo dela, escondendo o painel de comentários */
  border-radius: 22px;
  overflow: hidden;
  transform: translateZ(0);
  background: #07091a;
  transition: border-radius 0.3s ease;
}

/* Quando os comentários estão abertos, os cantos de baixo ficam retos
   para emendar com o painel de comentários e parecer um card único */
.media.comments-open {
  border-radius: 22px 22px 0 0;
}

.banner {
  display: block;
  width: 100%;
  height: clamp(380px, 42vw, 520px);
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

  /* For\u00e7a renderiza\u00e7\u00e3o de alta qualidade */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: high-quality;

  /* Suaviza\u00e7\u00e3o avan\u00e7ada para melhor qualidade */
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);

  /* For\u00e7a a GPU a processar a imagem */
  will-change: transform;
}

.feed-card:hover .banner {
  transform: scale(1.03);
}

/* ─── Gradient layers ────────────────────────────────────────────────────── */
.gradient-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 85% 0%, rgba(0, 0, 0, 0.35) 0%, transparent 55%);
  pointer-events: none;
  z-index: 1;
}

/* Refined gradient — image breathes more at the top */
.gradient-bottom {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top,
      rgba(0, 0, 0, 0.82) 0%,
      rgba(7, 9, 26, 0.72) 22%,
      rgba(7, 9, 26, 0.28) 48%,
      transparent 70%);
  pointer-events: none;
  z-index: 2;
  transition: background 0.6s ease;
}

/* ─── Host tag ───────────────────────────────────────────────────────────── */
.host-tag {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0.8rem 0.4rem 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.93);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  color: #1a1d35;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: transform 0.2s ease;
}

.host-tag:hover {
  transform: scale(1.03);
}

.host-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.host-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 0.78rem;
  text-transform: uppercase;
}

/* ─── Bookmark ───────────────────────────────────────────────────────────── */
.bookmark {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 10;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(7, 10, 22, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Área de toque mínima para acessibilidade */
  min-width: 44px;
  min-height: 44px;
}

.bookmark:hover {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(var(--accent-rgb), 0.45);
  border-color: transparent;
}

.bookmark:active {
  transform: scale(0.92);
}

@media (hover: none) {
  .bookmark:hover {
    transform: none;
    background: rgba(7, 10, 22, 0.55);
    box-shadow: none;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .bookmark:active {
    background: linear-gradient(135deg, var(--accent-light), var(--accent));
    transform: scale(0.92);
  }
}

.bookmark.saved {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  box-shadow: 0 6px 16px rgba(var(--accent-rgb), 0.4);
  border-color: transparent;
}

/* ─── Remove from Favorites Button ────────────────────────────────────────── */
.remove-favorite-btn {
  position: absolute;
  top: 18px;
  right: 72px;
  z-index: 10;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(7, 10, 22, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.remove-favorite-btn:hover {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45);
  border-color: transparent;
}

.remove-favorite-btn:active {
  transform: scale(0.95);
}

/* ─── Interests panel (slide-up) ─────────────────────────────────────────── */
.interests-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 1rem 1.2rem 1.35rem;
  background: rgba(6, 7, 20, 0.88);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.interests-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
}

.interests-panel-title {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.interests-close {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.interests-close:hover {
  background: rgba(var(--accent-rgb), 0.25);
  color: var(--accent-light);
  border-color: rgba(var(--accent-rgb), 0.4);
}

.interests-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* ─── Transition: interests slide up ─────────────────────────────────────── */
.interests-slide-enter-active,
.interests-slide-leave-active {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease;
}

.interests-slide-enter-from,
.interests-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ─── Interest chip ──────────────────────────────────────────────────────── */
.interest-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: rgba(var(--accent-rgb), 0.15);
  border: 1px solid rgba(var(--accent-rgb), 0.4);
  color: var(--accent-light);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: background 0.2s ease, transform 0.15s ease;
  transform: translateZ(0);
}

.interest-chip:hover {
  background: rgba(var(--accent-rgb), 0.28);
  transform: translateY(-1px);
}

/* ─── Overlay (figcaption) ───────────────────────────────────────────────── */
.overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.55rem;
  padding: clamp(1.2rem, 3.5vw, 1.8rem);
  padding-top: 4.5rem;
  color: #fff;
}

/* ─── Title ──────────────────────────────────────────────────────────────── */
.title {
  margin: 0;
  font-size: clamp(1.45rem, 1.1vw + 1.4rem, 2.5rem);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.015em;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── Interest Tags ──────────────────────────────────────────────────────── */
.interest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
  justify-content: flex-start;
}

@media (min-width: 641px) {
  .interest-tags {
    justify-content: flex-end;
  }
}

.interest-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  transform: translateZ(0);
}

.interest-tag.matched {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.85), rgba(255, 95, 166, 0.85));
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(233, 30, 99, 0.35);
}

.interest-tag.more {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.6rem;
}

/* ─── Meta pill ──────────────────────────────────────────────────────────── */
.meta-wrapper {
  display: flex;
  gap: 0.4rem;
  padding: 0.32rem 0.75rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  align-content: flex-end;
}

.meta-wrapper svg {
  flex-shrink: 0;
  opacity: 0.8;
}

.schedule {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--accent-light);
  text-transform: uppercase;
  white-space: nowrap;
  transition: color 0.4s ease;
}

.location {
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.3rem;
  flex-wrap: wrap;
  width: 100%;
}

.stats {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
  font-weight: 600;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.88);
}

/* Mobile: Footer sem efeito glass para melhor visualização do card */
@media (max-width: 480px) {
  .footer {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    margin: 0.5rem 0 0;
    padding: 0.5rem 0;
    border-radius: 0;
    gap: 0.5rem;
  }
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.stat-action {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: transform 0.15s ease, color 0.2s ease;
  /* Área de toque mínima para acessibilidade mobile */
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.25rem;
  border-radius: 12px;
}

.stat-action:hover {
  transform: translateY(-1px);
  color: var(--accent-light);
  background: rgba(255, 255, 255, 0.08);
}

.stat-action:active {
  transform: scale(0.95);
}

@media (hover: none) {
  .stat-action:hover {
    transform: none;
    background: transparent;
  }

  .stat-action:active {
    background: rgba(255, 255, 255, 0.12);
    transform: scale(0.95);
  }
}

.stat-action.liked {
  color: var(--accent);
  animation: heartPulse 0.3s ease;
}

.stat-action svg {
  color: #888;
  transition: color 0.2s ease, transform 0.2s ease;
}

.stat-action.liked svg {
  color: var(--accent);
}

@keyframes heartPulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.stat-action.comments-action:hover {
  color: #fff;
}

.stat-action.comments-action.active {
  color: var(--accent-light);
}

/* Interests action button */
.feed-card .interests-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  transition: color 0.2s ease, transform 0.15s ease;
  transform: translateZ(0);
}

.feed-card .interests-action:hover {
  color: var(--accent-light);
  transform: translateY(-1px) translateZ(0);
}

.feed-card .interests-action.active {
  color: var(--accent-light);
}

/* ─── Actions (icon buttons) ─────────────────────────────────────────────── */
.actions {
  display: flex;
  gap: 0.45rem;
  position: relative;
  z-index: 1;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  color: #fff;
  cursor: pointer;
  transition: background 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: translateZ(0);
  /* Garantir área de toque mínima em mobile */
  min-width: 44px;
  min-height: 44px;
}

.icon-button:hover {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  transform: translateY(-3px) scale(1.05) translateZ(0);
  box-shadow: 0 8px 18px rgba(var(--accent-rgb), 0.4);
  border-color: transparent;
}

.icon-button:active {
  transform: scale(0.95) translateZ(0);
}

@media (hover: none) {
  .icon-button:hover {
    transform: translateZ(0);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: none;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .icon-button:active {
    background: linear-gradient(135deg, var(--accent-light), var(--accent));
    transform: scale(0.95) translateZ(0);
  }
}

/* ─── Backdrop-filter: reduzido em mobile para performance ───────────────── */
/* Todos os elementos com backdrop-filter consolidados num único media query  */
@media (max-width: 768px) {
  .host-tag,
  .bookmark,
  .remove-favorite-btn,
  .interests-panel,
  .interest-tag,
  .meta-wrapper,
  .icon-button {
    backdrop-filter: blur(4px);
  }
}

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 920px) {
  .feed-card {
    padding: 0.3rem;
    border-radius: 24px;
  }

  .media {
    border-radius: 20px;
  }

  .banner {
    height: clamp(300px, 44vw, 400px);
  }

  .overlay {
    padding: clamp(1rem, 3vw, 1.5rem);
  }
}

@media (max-width: 640px) {
  .feed-card {
    padding: 0.22rem;
    border-radius: 20px;
  }

  .media {
    border-radius: 17px;
  }

  .banner {
    height: clamp(300px, 76vw, 400px);
  }

  .host-tag {
    top: 12px;
    left: 12px;
    font-size: 0.73rem;
    padding: 0.32rem 0.65rem 0.32rem 0.38rem;
  }

  .host-avatar {
    width: 23px;
    height: 23px;
  }

  .bookmark {
    width: 38px;
    height: 38px;
    top: 12px;
    right: 12px;
  }

  .title {
    font-size: 1.3rem;
  }

  .interest-tags {
    gap: 0.25rem;
    margin-top: 0.25rem;
  }

  .interest-tag {
    font-size: 0.6rem;
    padding: 0.15rem 0.45rem;
  }

  .location {
    max-width: 130px;
  }
}

@media (max-width: 480px) {
  .feed-card {
    padding: 0.18rem;
    border-radius: 16px;
  }

  .media {
    border-radius: 13px;
  }

  .banner {
    height: clamp(260px, 70vw, 340px);
  }

  .overlay {
    padding: 0.9rem;
    gap: 0.3rem;
  }

  .title {
    font-size: 1.15rem;
  }

  .interest-tags {
    gap: 0.2rem;
    margin-top: 0.2rem;
  }

  .interest-tag {
    font-size: 0.55rem;
    padding: 0.12rem 0.4rem;
  }

  .stats {
    font-size: 0.78rem;
    gap: 0.5rem;
  }

  .footer {
    gap: 0.5rem;
  }

  .icon-button {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .rank-badge {
    width: 42px;
    height: 42px;
    font-size: 1.3rem;
    border-radius: 13px;
    top: 8px;
    left: 8px;
  }

  .rank-badge span {
    font-size: 0.76rem;
  }

  /* Mobile: badge 42px wide at left 8px → ends at 50px → host-tag at 58px */
  .feed-card.highlight-card .host-tag {
    left: 58px;
  }

  .meta-wrapper {
    padding: 0.25rem 0.6rem;
    gap: 0.3rem;
  }

  .schedule,
  .location {
    font-size: 0.68rem;
  }

  .location {
    max-width: 110px;
  }

  .interests-action {
    font-size: 0.68rem;
    padding: 0.22rem 0.5rem;
  }

  .interest-chip {
    font-size: 0.63rem;
    padding: 0.18rem 0.55rem;
  }
}

/* ─── Banner Placeholder ─────────────────────────────────────────────────── */
.banner-placeholder {
  width: 100%;
  /* Garante a mesma altura do banner para evitar colapso do card */
  height: clamp(380px, 42vw, 520px);
  min-height: 380px;
  /* Altura mínima garantida */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #1a1d35 0%, #0e1428 100%);
  color: rgba(255, 255, 255, 0.3);
  /* Garante que ocupe o espaço esperado */
  flex-shrink: 0;
}

.banner-placeholder i {
  font-size: 3rem;
  opacity: 0.4;
}

.banner-placeholder span {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.5;
}

/* ─── Banner Placeholder Responsive ──────────────────────────────────────── */
@media (max-width: 640px) {
  .banner-placeholder {
    height: clamp(300px, 76vw, 400px);
    min-height: 300px;
  }

  .banner-placeholder i {
    font-size: 2.5rem;
  }

  .banner-placeholder span {
    font-size: 0.8rem;
  }

  .media {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .banner-placeholder {
    height: clamp(260px, 70vw, 340px);
    min-height: 260px;
  }

  .banner-placeholder i {
    font-size: 2rem;
  }

  .banner-placeholder span {
    font-size: 0.75rem;
  }

  .media {
    min-height: 260px;
  }

  /* Garantir que o card não seja cortado */
  .feed-card {
    margin: 0;
    max-width: 100%;
    width: 100%;
  }
}

</style>
