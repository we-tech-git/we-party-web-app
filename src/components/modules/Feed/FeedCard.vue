<script setup lang="ts">
  defineProps<{
    banner: string
    host: string
    title: string
    description: string
    schedule: string
    location: string
    participants: number
    bookmarks: number
  }>()

  function formatCount (value: number) {
    if (value < 1000) return value.toString()

    const rounded = value / 1000
    const formatted = rounded % 1 === 0 ? Math.trunc(rounded).toString() : rounded.toFixed(1)

    return `${formatted}k`
  }
</script>

<template>
  <article class="feed-card">
    <figure class="media">
      <img :alt="title" class="banner" loading="lazy" :src="banner">
      <span class="host-tag">{{ host }}</span>
      <button aria-label="Salvar evento" class="bookmark" type="button">
        <svg
          aria-hidden="true"
          fill="none"
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
    </figure>

    <figcaption class="overlay">
      <div class="meta">
        <span>{{ schedule }}</span>
        <span class="dot">•</span>
        <span>{{ location }}</span>
      </div>
      <h3 class="title">{{ title }}</h3>
      <p class="description">{{ description }}</p>
      <footer class="footer">
        <div aria-label="Indicadores do evento" class="stats">
          <span class="stat">
            <svg
              aria-hidden="true"
              class="icon"
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
            {{ formatCount(participants) }}
          </span>
          <span class="stat">
            <svg
              aria-hidden="true"
              class="icon"
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
            {{ formatCount(bookmarks) }}
          </span>
        </div>
        <button class="cta" type="button">Ver detalhes</button>
      </footer>
    </figcaption>
  </article>
</template>

<style scoped>
.feed-card {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background: #111;
  box-shadow: 0 18px 36px rgba(21, 24, 53, 0.15);
  isolation: isolate;
}

.media {
  position: relative;
  margin: 0;
}

.banner {
  display: block;
  width: 100%;
  height: 260px;
  object-fit: cover;
}

.host-tag {
  position: absolute;
  top: 18px;
  left: 18px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.bookmark {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(17, 24, 39, 0.55);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.bookmark:hover {
  background: rgba(236, 72, 153, 0.8);
  transform: translateY(-2px);
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.75rem;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.86) 68%, rgba(15, 23, 42, 0.95) 100%);
  color: #fff;
  gap: 0.6rem;
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  opacity: 0.85;
}

.dot {
  font-weight: 700;
}

.title {
  font-size: clamp(1.25rem, 1.2vw + 0.9rem, 1.6rem);
  line-height: 1.3;
  font-weight: 700;
}

.description {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  opacity: 0.85;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.4rem;
  gap: 1rem;
}

.stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  opacity: 0.95;
}

.icon {
  display: block;
}

.cta {
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #ff8a5b 0%, #ff5fa6 100%);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 20px rgba(255, 95, 166, 0.35);
}

.cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(255, 95, 166, 0.4);
}

@media (max-width: 920px) {
  .banner {
    height: 220px;
  }

  .overlay {
    padding: 1.25rem 1.4rem 1.6rem;
  }

  .title {
    font-size: 1.2rem;
  }
}

@media (max-width: 640px) {
  .feed-card {
    border-radius: 18px;
  }

  .banner {
    height: 200px;
  }

  .overlay {
    padding: 1.15rem;
  }

  .footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .cta {
    align-self: stretch;
    text-align: center;
  }
}
</style>
