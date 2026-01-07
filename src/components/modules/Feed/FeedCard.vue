<script setup lang="ts">
  import { computed } from 'vue'
  import { svgIcons } from '@/utils/svgSet'

  const props = defineProps<{
    id: string | number
    banner: string
    hostName: string
    hostAvatar: string
    title: string
    description: string
    schedule: string
    confirmed: number
    interested: number
    isSaved?: boolean
    likes?: number
    liked?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'toggle-save' | 'toggle-like'): void
  }>()

  function formatCount (value: number) {
    if (value < 1000) return value.toString()

    const rounded = value / 1000
    const formatted = rounded % 1 === 0 ? Math.trunc(rounded).toString() : rounded.toFixed(1)

    return `${formatted}k`
  }

  const fallbackBanner = 'https://via.placeholder.com/1200x600?text=Evento'

  function resolveAsset (val?: string) {
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
</script>

<template>
  <article class="feed-card">
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
          height="22"
          role="presentation"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="22"
        >
          <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
        </svg>
      </button>

      <figcaption class="overlay">
        <p class="schedule">{{ schedule }}</p>
        <h3 class="title">{{ title }}</h3>
        <p class="description">{{ description }}</p>

        <footer class="footer">
          <div aria-label="Indicadores do evento" class="stats">
            <button
              class="stat stat-action"
              :class="{ liked }
              "
              type="button"
              @click.stop="emit('toggle-like')"
            >
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                role="presentation"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                viewBox="0 0 24 24"
                width="18"
              >
                <path
                  d="M12 21s-6.6-4.35-9-8.4C1 8.67 3.42 5 7.2 5c1.9 0 3.45 1.17 4.8 2.6C13.35 6.17 14.9 5 16.8 5 20.58 5 23 8.67 21 12.6c-2.4 4.05-9 8.4-9 8.4Z"
                />
              </svg>
              {{ formatCount(likes ?? confirmed) }}
            </button>
            <span class="stat">
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                role="presentation"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                viewBox="0 0 24 24"
                width="18"
              >
                <path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                />
              </svg>
              {{ formatCount(interested) }}
            </span>
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
            </router-link>
            <button aria-label="Compartilhar" class="icon-button" type="button" @click.prevent>
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
            </button>
          </div>
        </footer>
      </figcaption>
    </figure>
  </article>
</template>

<style scoped>
.feed-card {
  position: relative;
  border-radius: 32px;
  overflow: hidden;
  background: #0a0f1f;
  box-shadow: 0 28px 58px rgba(12, 16, 37, 0.356);
  isolation: isolate;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  padding: 0.45rem;
  width: 100%;
}

.feed-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 36px 68px rgba(12, 16, 37, 0.45);
}

.media {
  position: relative;
  margin: 0;
  height: 100%;
}

.banner {
  display: block;
  width: 100%;
  height: clamp(320px, 35vw, 420px);
  object-fit: cover;
  border-radius: 24px;
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
  background: rgba(255, 255, 255, 0.88);
  color: #23253f;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
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
  border: none;
  background: rgba(7, 10, 22, 0.55);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.bookmark:hover {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 95, 166, 0.3);
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
  gap: 0.5rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(13, 16, 43, 0.8) 50%, rgba(8, 13, 30, 0.98) 100%);
  color: #ffffff;
  padding: clamp(1.4rem, 4vw, 2rem);
  padding-top: 5rem;
}

.schedule {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  font-size: clamp(0.86rem, 0.3vw + 0.8rem, 1.05rem);
  color: rgba(255, 255, 255, 0.78);
}

.title {
  margin: 0;
  font-size: clamp(1.5rem, 1.2vw + 1.45rem, 2.55rem);
  line-height: 1.2;
  font-weight: 700;
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
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.icon-button:hover {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 95, 166, 0.3);
  border: none;
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
