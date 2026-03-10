<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
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
  }>()

  const emit = defineEmits<{
    (e: 'toggle-save' | 'toggle-like'): void
  }>()

  function formatCount (value: number | undefined | null): string {
    const num = Number(value) || 0
    if (num < 1000) return num.toString()
    const rounded = num / 1000
    const formatted = rounded % 1 === 0 ? Math.trunc(rounded).toString() : rounded.toFixed(1)
    return `${formatted}k`
  }

  const fallbackBanner = 'https://via.placeholder.com/1200x600?text=Evento'

  function resolveAsset (val?: string) {
    if (!val) return ''
    if (/^https?:\/\//i.test(val)) return val
    const base = (import.meta.env.VITE__BASE_URL || '').replace(/\/$/, '')
    const path = val.startsWith('/') ? val : `/${val}`
    return `${base}${path}`
  }

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

  const avatarColor = computed(() => {
    if (!props.hostName) return avatarColors[0]
    let hash = 0
    for (let i = 0; i < props.hostName.length; i++) {
      hash = (props.hostName.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash % avatarColors.length)]
  })

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
      text: props.description,
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
    const sorted = [...props.interests].sort((a, b) => {
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

  function isMatchedInterest(tag: string): boolean {
    if (!props.matchedInterests || props.matchedInterests.length === 0) return false
    return props.matchedInterests.some(m => m.toLowerCase() === tag.toLowerCase())
  }
</script>

<template>
  <article class="feed-card" :class="{ 'highlight-card': highlight }">
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

      <!-- Bookmark -->
      <button
        aria-label="Salvar evento"
        class="bookmark"
        :class="{ saved: isSaved }"
        type="button"
        @click.stop="emit('toggle-save')"
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
            <span class="meta-sep">Â·</span>
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
            <button class="stat stat-action" :class="{ liked }" type="button" @click.stop="emit('toggle-like')">
              <svg
                aria-hidden="true"
                :fill="liked ? 'currentColor' : 'none'"
                height="17"
                role="presentation"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="17"
              >
                <path
                  d="M12 21s-6.6-4.35-9-8.4C1 8.67 3.42 5 7.2 5c1.9 0 3.45 1.17 4.8 2.6C13.35 6.17 14.9 5 16.8 5 20.58 5 23 8.67 21 12.6c-2.4 4.05-9 8.4-9 8.4Z"
                />
              </svg>
              {{ formatCount(likes) }}
            </button>
            <button
              aria-label="ComentÃ¡rios"
              class="stat stat-action comments-action"
              :class="{ active: showComments }"
              type="button"
              @click.stop="showComments = !showComments; showInterests = false"
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
            <router-link aria-label="Ver detalhes" class="icon-button" :to="`/private/event/${id}`">
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
            </router-link>
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

<style>
/* Global â€” strict to feed-card tooltips via content-class */
.v-overlay__content.feed-card-tooltip {
  background: rgba(14, 20, 38, 0.88) !important;
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.13);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  border-radius: 12px !important;
  padding: 6px 12px !important;
  font-size: 0.72rem !important;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffba4b !important;
}
</style>

<style scoped>
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
  background: #07091a;
  box-shadow: 0 24px 52px rgba(0, 0, 0, 0.4);
  isolation: isolate;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s ease;
  padding: 0.35rem;
  width: 100%;
}

.feed-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 36px 70px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(var(--accent-rgb), 0.18);
}

/* Highlight card */
.feed-card.highlight-card {
  box-shadow: 0 28px 56px rgba(var(--accent-rgb), 0.2),
    0 0 0 1px rgba(var(--accent-light-rgb), 0.25);
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
  box-shadow: 0 6px 18px rgba(var(--accent-rgb), 0.55);
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

/* ─── Media ──────────────────────────────────────────────────────────────── */
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
  backdrop-filter: blur(10px);
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
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(7, 10, 22, 0.55);
  backdrop-filter: blur(10px);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bookmark:hover {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(var(--accent-rgb), 0.45);
  border-color: transparent;
}

.bookmark.saved {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  box-shadow: 0 6px 16px rgba(var(--accent-rgb), 0.4);
  border-color: transparent;
}

/* ─── Interests panel (slide-up) ─────────────────────────────────────────── */
.interests-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 1rem 1.2rem 1.35rem;
  background: rgba(6, 7, 20, 0.82);
  backdrop-filter: blur(20px);
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
  transition: background 0.2s, color 0.2s;
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
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.65);
}

/* ─── Interest Tags ──────────────────────────────────────────────────────── */
.interest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
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
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  transition: all 0.2s ease;
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
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.4rem;
  padding: 0.32rem 0.75rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  align-self: flex-start;
  max-width: 100%;
  overflow: hidden;
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

.meta-sep {
  opacity: 0.35;
  font-size: 0.7rem;
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
}

.stat-action:hover {
  transform: translateY(-1px);
  color: var(--accent-light);
}

.stat-action.liked {
  color: var(--accent);
}

.stat-action.comments-action:hover {
  color: #fff;
}

.stat-action.comments-action.active {
  color: var(--accent-light);
}

/* Interests action button */
.interests-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  border: 1px solid rgba(var(--accent-rgb), 0.3) !important;
  background: rgba(var(--accent-rgb), 0.1) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s !important;
}

.interests-action:hover {
  background: rgba(var(--accent-rgb), 0.22) !important;
  border-color: rgba(var(--accent-rgb), 0.55) !important;
  color: var(--accent-light) !important;
  transform: translateY(-1px) !important;
}

.interests-action.active {
  background: rgba(var(--accent-rgb), 0.28) !important;
  border-color: rgba(var(--accent-light-rgb), 0.55) !important;
  color: var(--accent-light) !important;
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
  width: 40px;
  height: 40px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  color: #fff;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-button:hover {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 18px rgba(var(--accent-rgb), 0.4);
  border-color: transparent;
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
    width: 22px;
    height: 22px;
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
    top: -8px;
    left: -8px;
  }

  .rank-badge span {
    font-size: 0.76rem;
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
</style>
