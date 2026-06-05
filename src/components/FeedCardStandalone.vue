<!--
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                         FEED CARD STANDALONE                               ║
  ╠═══════════════════════════════════════════════════════════════════════════╣
  ║ Componente de card de evento/feed completo e independente                 ║
  ║ Pode ser usado em qualquer projeto Vue 3 + TypeScript                     ║
  ╚═══════════════════════════════════════════════════════════════════════════╝

  📦 DEPENDÊNCIAS:
  - Vue 3 (Composition API)
  - TypeScript
  - Opcional: Vuetify 3 (para tooltips - pode ser removido)

  🎯 PROPS:
  - id: Identificador único do evento
  - banner: URL da imagem de capa
  - hostName: Nome do anfitrião/organizador
  - hostAvatar: URL do avatar do anfitrião
  - title: Título do evento
  - description: Descrição do evento
  - schedule: Data/hora formatada (ex: "Sáb, 15 Jun · 20h")
  - location: Local do evento (opcional)
  - confirmed: Número de confirmados
  - interested: Número de interessados
  - isSaved: Se o evento está favoritado
  - likes: Número de curtidas
  - liked: Se o usuário curtiu o evento
  - highlight: Se é um evento em destaque
  - rank: Posição no ranking (se highlight)
  - interests: Array de interesses/tags
  - commentsCount: Número de comentários
  - matchedInterests: Interesses que correspondem ao perfil do usuário
  - guestMode: Se está em modo visitante (sem autenticação)

  🔥 EVENTOS:
  - @toggle-save: Disparado ao clicar no botão de favoritar
  - @toggle-like: Disparado ao clicar no botão de curtir
  - @details-click: Disparado ao clicar no botão de detalhes
  - @share-click: Disparado ao clicar no botão de compartilhar
  - @comments-toggle: Disparado ao abrir/fechar comentários
  - @interests-toggle: Disparado ao abrir/fechar interesses

  💡 EXEMPLO DE USO:
  ```vue
  <template>
    <FeedCardStandalone
      :id="event.id"
      :banner="event.banner"
      :host-name="event.hostName"
      :host-avatar="event.hostAvatar"
      :title="event.title"
      :description="event.description"
      :schedule="event.schedule"
      :location="event.location"
      :confirmed="event.confirmed"
      :interested="event.interested"
      :is-saved="event.isSaved"
      :likes="event.likes"
      :liked="event.liked"
      :interests="event.interests"
      :comments-count="event.commentsCount"
      @toggle-save="handleSave"
      @toggle-like="handleLike"
      @details-click="handleDetails"
      @share-click="handleShare"
    />
  </template>

  <script setup lang="ts">
  import FeedCardStandalone from './FeedCardStandalone.vue'

  const event = {
    id: '1',
    banner: 'https://example.com/banner.jpg',
    hostName: 'João Silva',
    hostAvatar: 'https://example.com/avatar.jpg',
    title: 'Festival de Música 2026',
    description: 'Um evento incrível com as melhores bandas',
    schedule: 'Sáb, 15 Jun · 20h',
    location: 'São Paulo, SP',
    confirmed: 150,
    interested: 320,
    isSaved: false,
    likes: 89,
    liked: false,
    interests: ['Música', 'Festa', 'Ao Ar Livre'],
    commentsCount: 24
  }

  function handleSave() {
    console.log('Saving event...')
  }

  function handleLike() {
    console.log('Liking event...')
  }

  function handleDetails() {
    console.log('Opening details...')
  }

  function handleShare() {
    console.log('Sharing event...')
  }
  </script>
  ```

  🎨 CUSTOMIZAÇÃO:
  As variáveis CSS podem ser alteradas:
  --accent: Cor primária (padrão: #ff5fa6)
  --accent-light: Cor secundária (padrão: #ffba4b)

-->

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'

  // ============================================================================
  // PROPS & EMITS
  // ============================================================================

  const props = defineProps<{
    id: string | number
    banner: string
    hostName: string
    hostAvatar?: string
    title: string
    description: string
    schedule: string
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
  }>()

  const emit = defineEmits<{
    (e: 'toggle-save' | 'toggle-like' | 'details-click' | 'share-click'): void
    (e: 'comments-toggle' | 'interests-toggle', visible: boolean): void
  }>()

  // ============================================================================
  // STATE
  // ============================================================================

  const showComments = ref(false)
  const showInterests = ref(false)
  const localCommentsCount = ref(props.commentsCount ?? 0)

  watch(() => props.commentsCount, val => {
    if (val !== undefined) localCommentsCount.value = val
  })

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function handleToggleLike () {
    emit('toggle-like')
  }

  function handleToggleSave () {
    emit('toggle-save')
  }

  function handleDetailsClick () {
    emit('details-click')
  }

  function handleShare () {
    emit('share-click')
  }

  function handleCommentsToggle () {
    showComments.value = !showComments.value
    showInterests.value = false
    emit('comments-toggle', showComments.value)
  }

  function toggleInterests (e: Event) {
    e.stopPropagation()
    showInterests.value = !showInterests.value
    if (showInterests.value) showComments.value = false
    emit('interests-toggle', showInterests.value)
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Formata números grandes em formato compacto (ex: 1500 => 1.5k)
   */
  function formatCount (value: number | undefined | null): string {
    const num = Number(value) || 0
    if (num < 1000) return num.toString()
    const rounded = num / 1000
    const formatted = rounded % 1 === 0 ? Math.trunc(rounded).toString() : rounded.toFixed(1)
    return `${formatted}k`
  }

  const fallbackBanner = 'https://via.placeholder.com/1200x600?text=Evento'

  /**
   * Resolve URLs de assets, suportando URLs absolutas e relativas
   */
  function resolveAsset (val?: string) {
    if (!val) return ''
    if (/^https?:\/\//i.test(val)) return val
    // Para URLs relativas, você pode configurar sua base URL
    const base = import.meta.env.VITE_BASE_URL || import.meta.env.BASE_URL || ''
    const cleanBase = base.replace(/\/$/, '')
    const path = val.startsWith('/') ? val : `/${val}`
    return `${cleanBase}${path}`
  }

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const bannerSrc = computed(() => {
    const src = resolveAsset(props.banner)
    return src || fallbackBanner
  })

  const hostAvatarSrc = computed(() => resolveAsset(props.hostAvatar))

  const hostInitial = computed(() => (props.hostName || 'U').charAt(0).toUpperCase())

  const avatarColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
  ]

  /**
   * Gera uma cor de avatar baseada no hash do nome
   */
  const avatarColor = computed(() => {
    if (!props.hostName) return avatarColors[0]
    let hash = 0
    for (let i = 0; i < props.hostName.length; i++) {
      hash = (props.hostName.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash % avatarColors.length)]
  })

  /**
   * Tags de interesses visíveis no card (max 3 + overflow)
   * Prioriza interesses que correspondem ao perfil do usuário
   */
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
    <!-- Rank Badge (para eventos em destaque) -->
    <div v-if="highlight && rank" class="rank-badge">
      <span>#</span>{{ rank }}
    </div>

    <figure class="media">
      <!-- Banner Image -->
      <img :alt="title" class="banner" loading="lazy" :src="bannerSrc">

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

      <!-- Bookmark Button -->
      <button
        aria-label="Salvar evento"
        class="bookmark"
        :class="{ saved: isSaved }"
        title="Favoritar"
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
      </button>

      <!-- Interests slide-up panel -->
      <Transition name="interests-slide">
        <div v-if="showInterests && interests && interests.length > 0" class="interests-panel" @click.stop>
          <div class="interests-panel-header">
            <span class="interests-panel-title">Interesses do evento</span>
            <button class="interests-close" type="button" @click.stop="showInterests = false">
              <svg
                fill="none"
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
        <!-- Title -->
        <h3 class="title">{{ title }}</h3>

        <!-- Interest tags (preview) -->
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
          <!-- Calendar icon -->
          <svg
            fill="none"
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

          <template v-if="location">
            <span class="meta-sep">·</span>
            <!-- Location pin icon -->
            <svg
              fill="none"
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

        <!-- Footer: stats + actions -->
        <footer class="footer">
          <div aria-label="Indicadores do evento" class="stats">
            <!-- Like button -->
            <button
              class="stat stat-action"
              :class="{ liked }"
              title="Curtir"
              type="button"
              @click.stop="handleToggleLike"
            >
              <svg
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
              {{ formatCount(likes) }}
            </button>

            <!-- Comments button -->
            <button
              aria-label="Comentários"
              class="stat stat-action comments-action"
              :class="{ active: showComments }"
              title="Comentários"
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
              title="Interesses"
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
            <!-- Details button -->
            <button
              aria-label="Ver detalhes"
              class="icon-button"
              title="Detalhes"
              type="button"
              @click.stop="handleDetailsClick"
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
                <line x1="12" x2="12" y1="16" y2="12" />
                <line x1="12" x2="12.01" y1="8" y2="8" />
              </svg>
            </button>

            <!-- Share button -->
            <button
              aria-label="Compartilhar"
              class="icon-button"
              title="Compartilhar"
              type="button"
              @click.prevent="handleShare"
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
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
              </svg>
            </button>
          </div>
        </footer>
      </figcaption>
    </figure>

    <!-- Slot para comentários inline ou outros conteúdos -->
    <slot :event-id="id" name="comments" :show-comments="showComments" />
  </article>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   CSS VARIABLES
   ═══════════════════════════════════════════════════════════════════════════ */
.feed-card {
  --accent: #ff5fa6;
  --accent-light: #ffba4b;
  --accent-rgb: 255, 95, 166;
  --accent-light-rgb: 255, 186, 75;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARD CONTAINER
   ═══════════════════════════════════════════════════════════════════════════ */
.feed-card {
  position: relative;
  border-radius: 28px;
  overflow: visible;
  background: #07091a;
  isolation: isolate;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  padding: 0.35rem;
  width: 100%;
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}

.feed-card:hover {
  transform: translateY(-6px) translateZ(0);
}

.feed-card:not(:hover) {
  will-change: auto;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HIGHLIGHT CARD (Destaque)
   ═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   RANK BADGE
   ═══════════════════════════════════════════════════════════════════════════ */
.rank-badge {
  position: absolute;
  top: -12px;
  left: -12px;
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

/* ═══════════════════════════════════════════════════════════════════════════
   MEDIA CONTAINER
   ═══════════════════════════════════════════════════════════════════════════ */
.media {
  position: relative;
  margin: 0;
  height: 100%;
  border-radius: 22px;
  overflow: hidden;
  transform: translateZ(0);
}

.banner {
  display: block;
  width: 100%;
  height: clamp(380px, 42vw, 520px);
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.feed-card:hover .banner {
  transform: scale(1.03);
}

/* ═══════════════════════════════════════════════════════════════════════════
   GRADIENT OVERLAYS
   ═══════════════════════════════════════════════════════════════════════════ */
.gradient-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 85% 0%, rgba(0, 0, 0, 0.35) 0%, transparent 55%);
  pointer-events: none;
  z-index: 1;
}

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

/* ═══════════════════════════════════════════════════════════════════════════
   HOST TAG
   ═══════════════════════════════════════════════════════════════════════════ */
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
  color: #1a1d35;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: transform 0.2s ease;
}

@media (max-width: 768px) {
  .host-tag {
    backdrop-filter: blur(4px);
  }
}

.host-tag:hover {
  transform: scale(1.03);
}

.host-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
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

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKMARK BUTTON
   ═══════════════════════════════════════════════════════════════════════════ */
.bookmark {
  position: absolute;
  top: 18px;
  right: 18px;
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
    border-color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (max-width: 768px) {
  .bookmark {
    backdrop-filter: blur(3px);
  }
}

.bookmark:hover {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  transform: scale(1.1);
  border-color: transparent;
}

.bookmark.saved {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  border-color: transparent;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INTERESTS PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
.interests-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: rgba(7, 10, 22, 0.96);
  backdrop-filter: blur(16px);
  border-radius: 22px 22px 0 0;
  padding: 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  max-height: 70%;
  overflow-y: auto;
}

.interests-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.interests-panel-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-light);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.interests-close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.interests-close:hover {
  background: rgba(255, 95, 166, 0.15);
  border-color: var(--accent);
  color: var(--accent);
  transform: rotate(90deg);
}

.interests-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.interest-chip {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  transition: all 0.2s ease;
}

.interest-chip:hover {
  background: rgba(var(--accent-rgb), 0.15);
  border-color: var(--accent);
  color: var(--accent-light);
  transform: translateY(-2px);
}

/* Transitions */
.interests-slide-enter-active,
.interests-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease;
}

.interests-slide-enter-from,
.interests-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERLAY CONTENT
   ═══════════════════════════════════════════════════════════════════════════ */
.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  padding: 1.5rem 1.8rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  color: #fff;
}

.title {
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  font-weight: 800;
  line-height: 1.25;
  margin: 0;
  color: #fff;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.6);
  letter-spacing: -0.02em;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INTEREST TAGS (Preview)
   ═══════════════════════════════════════════════════════════════════════════ */
.interest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.interest-tag {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}

.interest-tag.matched {
  background: linear-gradient(135deg, rgba(var(--accent-light-rgb), 0.25), rgba(var(--accent-rgb), 0.25));
  border-color: var(--accent);
  color: var(--accent-light);
  box-shadow: 0 0 16px rgba(var(--accent-rgb), 0.3);
}

.interest-tag.more {
  background: rgba(255, 255, 255, 0.08);
  border-style: dashed;
  color: rgba(255, 255, 255, 0.7);
}

/* ═══════════════════════════════════════════════════════════════════════════
   META (Date & Location)
   ═══════════════════════════════════════════════════════════════════════════ */
.meta-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  width: fit-content;
}

@media (max-width: 768px) {
  .meta-wrapper {
    backdrop-filter: blur(4px);
  }
}

.meta-wrapper svg {
  flex-shrink: 0;
  opacity: 0.85;
}

.schedule,
.location {
  white-space: nowrap;
}

.meta-sep {
  color: rgba(255, 255, 255, 0.4);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER (Stats & Actions)
   ═══════════════════════════════════════════════════════════════════════════ */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.stats {
  display: flex;
  gap: 1.2rem;
  align-items: center;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  background: none;
  border: none;
  padding: 0;
  transition: all 0.2s ease;
}

.stat-action {
  cursor: pointer;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-action:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  transform: translateY(-2px);
}

.stat-action.liked,
.stat-action.active {
  background: linear-gradient(135deg, rgba(var(--accent-light-rgb), 0.2), rgba(var(--accent-rgb), 0.2));
  border-color: var(--accent);
  color: var(--accent-light);
}

.stat-action svg {
  transition: transform 0.2s ease;
}

.stat-action:hover svg {
  transform: scale(1.1);
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  border-color: transparent;
  transform: scale(1.08);
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .feed-card {
    border-radius: 20px;
    padding: 0.25rem;
  }

  .media {
    border-radius: 16px;
  }

  .banner {
    height: clamp(320px, 60vw, 420px);
  }

  .overlay {
    padding: 1.2rem 1.4rem 1.3rem;
    gap: 0.7rem;
  }

  .title {
    font-size: 1.2rem;
  }

  .footer {
    flex-direction: column;
    gap: 0.8rem;
    align-items: flex-start;
  }

  .stats {
    gap: 0.8rem;
  }

  .actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACCESSIBILITY & PERFORMANCE
   ═══════════════════════════════════════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {

  .feed-card,
  .banner,
  .bookmark,
  .rank-badge,
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* Focus visible para acessibilidade */
.bookmark:focus-visible,
.stat-action:focus-visible,
.icon-button:focus-visible,
.interests-close:focus-visible {
  outline: 2px solid var(--accent-light);
  outline-offset: 2px;
}
</style>
