<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
  import { useAuth } from '@/composables/useAuth'
  import { svgIcons } from '@/utils/svgSet'

  interface UserSummary {
    name: string
    avatar: string
  }

  defineProps<{
    user: UserSummary
    showBackBtn?: boolean
  }>()
  const { t } = useI18n()
  const router = useRouter()
  const { logout: authLogout } = useAuth()

  const avatarColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  ]

  function getAvatarColor (name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash % avatarColors.length)
    return avatarColors[index] ?? '#F44336'
  }

  function getInitial (name: string): string {
    return (name || 'U').charAt(0).toUpperCase()
  }

  function logout () {
    authLogout()
    router.push('/public/Login')
  }
</script>

<template>
  <header aria-label="Brand header" class="feed-top-header">
    <div class="header-inner">
      <div class="brand-wrapper">
        <button
          v-if="showBackBtn"
          :aria-label="t('common.back') || 'Voltar'"
          class="nav-back-btn"
          type="button"
          @click="router.back()"
        >
          <svg
            fill="none"
            height="24"
            stroke="currentColor"
            stroke-width="2.5"
            :viewBox="svgIcons.backArrow.viewBox"
            width="24"
          >
            <path v-for="(path, idx) in svgIcons.backArrow.paths" :key="idx" v-bind="path" />
          </svg>
        </button>
        <span aria-hidden="true" class="brand notranslate" translate="no">WE PARTY</span>
      </div>
      <div class="center-container">
        <slot name="center-content" />
      </div>
      <div class="user-summary">
        <div class="lang-switch-wrapper">
          <LanguageSwitcher />
        </div>

        <v-menu location="bottom" transition="slide-y-transition">
          <template #activator="{ props: menuProps }">
            <img
              v-if="user.avatar"
              v-bind="menuProps"
              :alt="user.name"
              class="avatar"
              loading="lazy"
              :src="user.avatar"
            >
            <div
              v-else
              v-bind="menuProps"
              class="avatar avatar-placeholder"
              :style="{ backgroundColor: getAvatarColor(user.name) }"
            >
              {{ getInitial(user.name) }}
            </div>
          </template>

          <v-list density="compact" :lines="false">
            <v-list-item @click="logout">
              <v-list-item-title>{{ t('feed.profileActions.logout') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </header>
</template>

<style scoped>
.feed-top-header {
  box-sizing: border-box;
  width: 100%;
  padding: .7rem 0 1.6rem;
  /* Added horizontal padding */
  position: sticky;
  top: 0;
  z-index: 50;
  /* Increased z-index to ensure it stays on top */
  background: rgba(255, 245, 247, 0.85);
  /* Semi-transparent background matching the theme */
  backdrop-filter: blur(12px);
  /* Blur effect for better readability */
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  /* Subtle separator */
}

.header-inner {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem;
}

.brand-wrapper {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-shrink: 0;
}

.nav-back-btn {
  background: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #ff5fa6;
}

.nav-back-btn:hover {
  transform: translateX(-2px) scale(1.05);
  background: linear-gradient(135deg, #fff0f5 0%, #fff 100%);
  color: #ff3385;
  box-shadow: 0 6px 16px rgba(255, 95, 166, 0.3);
}

.nav-back-btn:active {
  transform: scale(0.95);
}

.nav-back-btn svg {
  display: block;
}

.brand {
  font-family: "Baloo Thambi 2", serif;
  font-weight: 800;
  font-size: 2.8rem;
  background: linear-gradient(90deg, #ffba4b 0%, #ff5fa6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.center-container {
  width: 100%;
  display: flex;
  justify-content: center;
  min-width: 0;
  /* Allows shrinking */
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-shrink: 0;
  padding: 0.5rem 0.75rem 0.5rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.281) 0%, rgba(255, 95, 167, 0.308) 100%);
  border-radius: 999px;
  box-shadow: 0 10px 30px rgba(14, 23, 58, 0.08);
  /* Similar shadow to generic cards */
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(14, 23, 58, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.avatar:hover {
  transform: scale(1.05);
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  user-select: none;
}

@media (max-width: 1240px) {
  .header-inner {
    padding: 0 0.75rem;
  }
}

@media (max-width: 960px) {
  .header-inner {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .brand {
    display: none;
  }

  .lang-switch-wrapper {
    display: none;
  }

  .user-summary {
    justify-self: center;
    position: absolute;
    top: 0.5rem;
    right: 1rem;
    padding: 0.35rem 0.5rem 0.35rem 0.75rem;
  }

  .feed-top-header {
    padding: 0.5rem 1rem 0.75rem;
    position: relative;
  }

  .center-container {
    width: 100%;
    padding-top: 0.25rem;
  }
}

@media (max-width: 480px) {
  .feed-top-header {
    padding: 0.4rem 0.5rem 0.6rem;
  }

  .user-summary {
    gap: 0.5rem;
    padding: 0.3rem 0.4rem 0.3rem 0.6rem;
    top: 0.4rem;
    right: 0.5rem;
  }

  .avatar {
    width: 34px;
    height: 34px;
  }
}
</style>
