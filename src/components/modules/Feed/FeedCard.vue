<script setup lang="ts">
import { computed } from 'vue'
import { useShareStore } from '@/stores/share'
import { svgIcons } from '@/utils/svgSet'

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
}>()

const emit = defineEmits<{
  (e: 'toggle-save' | 'toggle-like'): void
}>()

function formatCount(value: number | undefined | null): string {
  const num = Number(value) || 0
  if (num < 1000) return num.toString()

  const rounded = num / 1000
  const formatted = rounded % 1 === 0 ? Math.trunc(rounded).toString() : rounded.toFixed(1)

  return `${formatted}k`
}

const fallbackBanner = 'https://via.placeholder.com/1200x600?text=Evento'

function resolveAsset(val?: string) {
  if (!val) return '' // Mudança aqui: não retorna fallback padrão se for vazio
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

// Lógica para avatar gerado (iniciais + cor)
const hostInitial = computed(() => {
  return (props.hostName || 'U').charAt(0).toUpperCase()
})

// Lista de cores pastel / material design
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
  const index = Math.abs(hash % avatarColors.length)
  return avatarColors[index]
})

const shareStore = useShareStore()

function handleShare() {
  shareStore.open({
    title: props.title,
    text: props.description,
    url: `${window.location.origin}/private/event/${props.id}`,
  })
}
</script>

<template>
  <article class="feed-card" :class="{ 'highlight-card': highlight }">
    <div v-if="highlight && rank" class="rank-badge">
      <span>#</span>{{ rank }}
    </div>
    <figure class="media">
      <img :alt="title" class="banner" loading="lazy" :src="bannerSrc">

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

      <button aria-label="Salvar evento" class="bookmark" :class="{ saved: isSaved }" type="button"
        @click.stop="emit('toggle-save')">
        <svg aria-hidden="true" :fill="isSaved ? 'currentColor' : 'none'" height="22" role="presentation"
          stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"
          width="22">
          <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
        </svg>
        <v-tooltip activator="parent" content-class="feed-card-tooltip" location="start" offset="10">
          Favoritar
        </v-tooltip>
      </button>

      <figcaption class="overlay">

        <h3 class="title">{{ title }}</h3>
        <div class="meta-wrapper">
          <span class="schedule">{{ schedule }}</span>
          <span v-if="location" class="location"> • {{ location }}</span>
        </div>
        <p class="description">{{ description }}</p>

        <footer class="footer">
          <div aria-label="Indicadores do evento" class="stats">
            <button class="stat stat-action" :class="{ liked }
              " type="button" @click.stop="emit('toggle-like')">
              <svg aria-hidden="true" fill="none" height="18" role="presentation" stroke="currentColor"
                stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewBox="0 0 24 24" width="18">
                <path
                  d="M12 21s-6.6-4.35-9-8.4C1 8.67 3.42 5 7.2 5c1.9 0 3.45 1.17 4.8 2.6C13.35 6.17 14.9 5 16.8 5 20.58 5 23 8.67 21 12.6c-2.4 4.05-9 8.4-9 8.4Z" />
              </svg>
              {{ formatCount(likes) }}
            </button>
          </div>

          <div class="actions">
            <router-link aria-label="Ver detalhes" class="icon-button" :to="`/private/event/${id}`">
              <svg v-if="svgIcons.infoIcon" fill="none" height="18" viewBox="0 0 256 256" width="18">
                <path v-for="(path, index) in svgIcons.infoIcon.paths" :key="index" :d="path.d" fill="#ffffff"
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="16" />
              </svg>
              <v-tooltip activator="parent" content-class="feed-card-tooltip" location="top" offset="10">
                Detalhes
              </v-tooltip>
            </router-link>
            <button aria-label="Compartilhar" class="icon-button" type="button" @click.prevent="handleShare">
              <svg v-if="svgIcons.shareIcon" fill="none" height="18" viewBox="0 0 256 256" width="18">
                <path v-for="(path, index) in svgIcons.shareIcon.paths" :key="index" :d="path.d" fill="#ffffff"
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="16" />
              </svg>
              <v-tooltip activator="parent" content-class="feed-card-tooltip" location="top" offset="10">
                Compartilhar
              </v-tooltip>
            </button>
          </div>
        </footer>
      </figcaption>
    </figure>
  </article>
</template>

<style>
/* Global style strictly scoped to this component's tooltip usage via content-class */
.v-overlay__content.feed-card-tooltip {
  background: rgba(14, 20, 38, 0.85) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border-radius: 12px !important;
  padding: 6px 12px !important;
  font-size: 0.75rem !important;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #ffba4b !important;
}
</style>

<style scoped>
.feed-card {
  position: relative;
  border-radius: 32px;
  overflow: visible;
  background: #0a0f1f;
  box-shadow: 0 28px 58px rgba(12, 16, 37, 0.356);
  isolation: isolate;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  padding: 0.45rem;
  width: 100%;
}

.feed-card.highlight-card {
  box-shadow: 0 30px 60px rgba(255, 95, 166, 0.15), 0 0 0 1px rgba(255, 186, 75, 0.3);
}

/* Gradient border effect via pseudo-element to respect border-radius */
.feed-card.highlight-card::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -1;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6, #9C27B0);
  border-radius: 34px;
  /* feed-card radius (32px) + 2px offset */
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.feed-card.highlight-card:hover::before {
  opacity: 1;
}

.rank-badge {
  position: absolute;
  top: -12px;
  left: -12px;
  z-index: 50;
  width: 56px;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-weight: 800;
  font-size: 1.8rem;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.5);
  transform: rotate(-10deg) scale(1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rank-badge span {
  font-size: 1rem;
  margin-right: 2px;
  opacity: 0.8;
  vertical-align: top;
  margin-top: -8px;
}

.feed-card.highlight-card:hover .rank-badge {
  transform: rotate(0deg) scale(1.1);
}

.feed-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 36px 68px rgba(12, 16, 37, 0.45);
}

.media {
  position: relative;
  margin: 0;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  /* Ensure mask for Safari/Webkit if needed */
  transform: translateZ(0);
}

.banner {
  display: block;
  width: 100%;
  height: clamp(320px, 35vw, 420px);
  object-fit: cover;
  /* border-radius removed here as it is handled by parent .media */
  padding: 0rem;
}

.host-tag {
  position: absolute;
  top: 20px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  color: #23253f;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.host-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.host-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  object-fit: cover;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.bookmark {
  position: absolute;
  top: clamp(18px, 2.2vw, 30px);
  right: clamp(18px, 2.2vw, 30px);
  z-index: 20;
  display: grid;
  place-items: center;
  width: clamp(46px, 3.8vw, 56px);
  height: clamp(46px, 3.8vw, 56px);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(7, 10, 22, 0.6);
  backdrop-filter: blur(8px);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bookmark:hover {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 95, 166, 0.4);
  border-color: transparent;
}

.bookmark.saved {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  box-shadow: 0 8px 16px rgba(255, 95, 166, 0.3);
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 20%, rgba(13, 16, 43, 0.85) 60%, rgba(8, 13, 30, 0.98) 100%);
  color: #ffffff;
  padding: clamp(1.4rem, 4vw, 2rem);
  padding-top: 5rem;
}

.schedule {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  font-size: 0.8rem;
  color: #ffba4b;
}

.location {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.meta-wrapper {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.2rem;
  margin-bottom: 0.4rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  padding: 0.35rem 0.8rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  align-self: flex-start;
}

.title {
  margin: 0;
  font-size: clamp(1.5rem, 1.2vw + 1.45rem, 2.55rem);
  line-height: 1.15;
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.description {
  margin: 0;
  font-size: clamp(1rem, 0.4vw + 0.95rem, 1.18rem);
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.9);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: clamp(0.75rem, 1vw, 1.5rem);
}

.stats {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-action {
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: transform 0.15s ease, color 0.2s ease;
}

.stat-action:hover {
  transform: translateY(-1px);
  color: #ff8dc5;
}

.stat-action.liked {
  color: #ff5fa6;
}

.actions {
  display: flex;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
  justify-content: center;
}

.icon-button {
  display: grid;
  place-items: center;
  width: clamp(38px, 3vw, 48px);
  height: clamp(38px, 3vw, 48px);
  border-radius: clamp(12px, 2vw, 16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-button:hover {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(255, 95, 166, 0.3);
  border-color: transparent;
}

.bookmark svg,
.stat svg,
.icon-button svg {
  width: clamp(20px, 2.3vw, 24px);
  height: clamp(20px, 2.3vw, 24px);
}

@media (max-width: 920px) {
  .feed-card {
    padding: clamp(1.25rem, 3vw, 1.85rem);
    border-radius: 28px;
  }

  .banner {
    height: clamp(260px, 40vw, 320px);
    border-radius: 22px;
  }

  .overlay {
    padding: clamp(1.4rem, 4vw, 2rem);
  }
}

@media (max-width: 640px) {
  .feed-card {
    border-radius: 24px;
  }

  .banner {
    height: clamp(300px, 90vw, 380px);
    border-radius: 20px;
  }

  .footer {
    flex-direction: row;
    align-items: center;
  }

  .actions {
    margin-top: 0;
  }

  .title {
    font-size: 1.5rem;
  }

  .description {
    font-size: 0.9rem;
    line-height: 1.4;
  }
}
</style>
