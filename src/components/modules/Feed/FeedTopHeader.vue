<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
  import { useAuth } from '@/composables/useAuth'
  import { svgIcons } from '@/utils/svgSet'

  interface UserSummary {
    name: string
    avatar: string
    username?: string
    bio?: string
  }

  defineProps<{
    user: UserSummary
    showBackBtn?: boolean
    guestMode?: boolean
  }>()
  const { t } = useI18n()
  const router = useRouter()
  const { logout: authLogout, loggedUser } = useAuth()

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

  function goToLogin () {
    router.push('/public/Login')
  }

  function goToSignup () {
    router.push('/public/Signup')
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
        <div class="brand-logo-wrapper">
          <img alt="We Party Logo" class="brand-logo-img" src="/logoweparty.png">
          <span aria-hidden="true" class="brand notranslate" translate="no">WE PARTY</span>
        </div>
      </div>
      <div class="center-container">
        <slot name="center-content" />
      </div>
      <div class="user-summary">
        <div class="lang-switch-wrapper">
          <LanguageSwitcher />
        </div>

        <!-- Modo Guest: Botões de Login/Cadastro -->
        <template v-if="guestMode">
          <div class="guest-actions">
            <button class="btn-guest-login" type="button" @click="goToLogin">
              Entrar
            </button>
            <button class="btn-guest-signup" type="button" @click="goToSignup">
              Criar Conta
            </button>
          </div>
        </template>

        <!-- Modo Autenticado: Menu do Usuário -->
        <template v-else>
          <v-menu location="bottom" transition="slide-y-transition">
            <template #activator="{ props: menuProps }">
              <div class="display-user-header" v-bind="menuProps">
                <div class="user-avatar-section">
                  <img
                    v-if="user.avatar"
                    :alt="user.name"
                    class="avatar"
                    loading="lazy"
                    :src="user.avatar"
                  >
                  <div v-else class="avatar avatar-placeholder" :style="{ backgroundColor: getAvatarColor(user.name) }">
                    {{ getInitial(user.name) }}
                  </div>
                </div>
                <div class="user-info-section">
                  <h2 class="user-name">{{ user.name }}</h2>
                  <span v-if="user.username" class="user-handle">{{ user.username }}</span>
                </div>
              </div>
            </template>

            <v-list class="user-dropdown-list" density="compact" :lines="false">
              <!-- Cabeçalho com info do usuário -->
              <div class="user-dropdown-header">
                <div class="dropdown-avatar" :style="{ backgroundColor: getAvatarColor(user.name) }">
                  <img
                    v-if="user.avatar"
                    :alt="user.name"
                    :src="user.avatar"
                    style="width:100%;height:100%;border-radius:50%;object-fit:cover;"
                  >
                  <span v-else>{{ getInitial(user.name) }}</span>
                </div>
                <div class="dropdown-user-info">
                  <p class="dropdown-user-name">{{ user.name }}</p>
                  <p v-if="loggedUser?.email" class="dropdown-user-email">{{ loggedUser.email }}</p>
                </div>
              </div>

              <v-divider class="my-1" />

              <!-- Navegar para perfil -->
              <v-list-item class="dropdown-action-item" rounded="lg" @click="router.push('/private/profile')">
                <template #prepend>
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
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </template>
                <v-list-item-title>{{ t('feed.profileActions.profile') }}</v-list-item-title>
              </v-list-item>

              <v-divider class="my-1" />

              <!-- Sair -->
              <v-list-item class="dropdown-action-item dropdown-logout" rounded="lg" @click="logout">
                <template #prepend>
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
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                </template>
                <v-list-item-title>{{ t('feed.profileActions.logout') }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.feed-top-header {
  box-sizing: border-box;
  width: 100%;
  padding: 15px 0;
  top: 0;
  z-index: 200;
  background: rgba(255, 245, 247, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 40px;
}

.display-user-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.display-user-header:hover {
  background: rgba(255, 255, 255, 0.5);
}

.user-avatar-section {
  flex-shrink: 0;
}

.user-info-section {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.user-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1a1c2e;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-handle {
  font-size: 0.75rem;
  color: #9aa0b8;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-inner {
  grid-template-columns: minmax(180px, 250px) 1fr minmax(200px, 250px);
  grid-template-areas: 'sidebar main trends';
  display: grid;
  box-sizing: border-box;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem;
  align-items: center;
}

.brand-wrapper {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-shrink: 0;
}

.brand-logo-wrapper {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 auto;
}

.brand-logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
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
  font-size: 2rem;
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
  flex-shrink: 0;
  padding: 0.3rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 252, 0.95) 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(14, 23, 58, 0.08), 0 0 0 1px rgba(255, 95, 166, 0.1);
  min-width: 265px;
  transition: all 0.3s ease;
}

.user-summary:hover {
  box-shadow: 0 6px 20px rgba(14, 23, 58, 0.12), 0 0 0 1px rgba(255, 95, 166, 0.2);
}

/* Guest mode action buttons */
.guest-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-guest-login,
.btn-guest-signup {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-guest-login {
  background: transparent;
  color: #1a1d2e;
  border: 1.5px solid rgba(26, 29, 46, 0.2);
}

.btn-guest-login:hover {
  background: rgba(26, 29, 46, 0.05);
  border-color: rgba(26, 29, 46, 0.3);
}

.btn-guest-signup {
  background: linear-gradient(135deg, #ff9ab5 0%, #ffb74d 100%);
  color: #1a1d2e;
  box-shadow: 0 4px 12px rgba(255, 154, 181, 0.3);
}

.btn-guest-signup:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 154, 181, 0.4);
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

/* Dropdown do usuário */
:deep(.user-dropdown-list) {
  min-width: 230px;
  padding: 8px !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(14, 23, 58, 0.12) !important;
}

.user-dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px 10px;
}

.dropdown-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(14, 23, 58, 0.12);
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dropdown-user-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a1a2e;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-user-email {
  font-size: 0.75rem;
  color: #888;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.dropdown-action-item) {
  border-radius: 10px !important;
  gap: 10px;
  font-size: 0.875rem;
  color: #333;
  transition: background 0.15s ease;
}

:deep(.dropdown-action-item .v-list-item__prepend) {
  width: 28px;
  min-width: 28px;
}

:deep(.dropdown-action-item:hover) {
  background: rgba(255, 95, 166, 0.07) !important;
}

:deep(.dropdown-logout) {
  color: #ff4757 !important;
}

:deep(.dropdown-logout:hover) {
  background: rgba(255, 71, 87, 0.07) !important;
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
    top: calc(0.5rem + env(safe-area-inset-top, 0px));
    right: max(1rem, env(safe-area-inset-right, 0px));
    padding: 0.5rem 0.75rem;
    min-width: auto;
    max-width: 200px;
  }

  .user-info-section {
    max-width: 120px;
  }

  .user-name {
    font-size: 0.85rem;
  }

  .user-handle {
    font-size: 0.7rem;
  }

  .feed-top-header {
    padding: calc(0.5rem + env(safe-area-inset-top, 0px)) 1rem 0.75rem;
    position: relative;
  }

  .center-container {
    width: 100%;
    padding-top: 0.25rem;
  }
}

@media (max-width: 480px) {
  .feed-top-header {
    padding: calc(0.4rem + env(safe-area-inset-top, 0px)) 0.5rem 0.6rem;
  }

  .user-summary {
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    top: calc(0.4rem + env(safe-area-inset-top, 0px));
    right: max(0.5rem, env(safe-area-inset-right, 0px));
  }

  .avatar {
    width: 36px;
    height: 36px;
  }

  .user-name {
    font-size: 0.8rem;
  }

  .user-handle {
    display: none;
  }
}
</style>
