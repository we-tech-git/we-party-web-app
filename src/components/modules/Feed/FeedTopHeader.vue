<script setup lang="ts">
  interface UserSummary {
    name: string
    avatar: string
    points: number
  }

  defineProps<{
    user: UserSummary
  }>()
</script>

<template>
  <header aria-label="Brand header" class="feed-top-header">
    <span aria-hidden="true" class="brand">WE PARTY</span>

    <div class="user-summary">
      <span class="points">
        <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
          <path
            d="m12 3 2.09 4.74 5.16.45-3.9 3.37 1.16 5.02L12 14.92l-4.51 3.66 1.16-5.02-3.9-3.37 5.16-.45z"
            fill="url(#starGradient)"
          />
          <defs>
            <linearGradient
              id="starGradient"
              gradientUnits="userSpaceOnUse"
              x1="12"
              x2="12"
              y1="3"
              y2="21"
            >
              <stop stop-color="#ffba4b" />
              <stop offset="1" stop-color="#ff5fa6" />
            </linearGradient>
          </defs>
        </svg>
        <span>{{ user.points }} pts.</span>
      </span>

      <img :alt="user.name" class="avatar" loading="lazy" :src="user.avatar">
    </div>
  </header>
</template>

<style scoped>
.feed-top-header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 2.75rem clamp(1.5rem, 6vw, 4.5rem) 2.25rem;
  background: linear-gradient(180deg, #ffffff 0%, #fff7fb 100%);
  box-shadow: 0 32px 64px rgba(15, 23, 42, 0.12);
  gap: 1.5rem;
  position: relative;
  z-index: 2;
}

.brand {
  font-family: 'Baloo Thambi 2', cursive;
  font-size: 2.35rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: linear-gradient(120deg, #ff9a62 0%, #ff5fa6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.user-summary {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.4rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 244, 248, 0.9) 0%, rgba(255, 210, 236, 0.75) 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 95, 166, 0.18);
}

.points {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 700;
  color: #b450ff;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  object-fit: cover;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
}

@media (max-width: 1200px) {
  .feed-top-header {
    padding: 2.5rem clamp(1.5rem, 5vw, 3rem) 2rem;
  }

  .brand {
    font-size: 2.1rem;
  }
}

@media (max-width: 960px) {
  .feed-top-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
    padding: 2.25rem 2rem 1.85rem;
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.1);
  }

  .user-summary {
    padding: 0.85rem 1.2rem;
  }
}

@media (max-width: 640px) {
  .feed-top-header {
    padding: 2rem 1.5rem 1.65rem;
  }

  .brand {
    font-size: 1.85rem;
    letter-spacing: 0.08em;
  }

  .user-summary {
    gap: 0.75rem;
  }

  .avatar {
    width: 38px;
    height: 38px;
  }
}
</style>
