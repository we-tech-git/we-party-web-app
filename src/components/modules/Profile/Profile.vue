<script setup lang="ts">
import type { NavItem } from '@/components/modules/Feed/FeedSidebarNav.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FeedSidebarNav from '@/components/modules/Feed/FeedSidebarNav.vue'
import FeedTopHeader from '@/components/modules/Feed/FeedTopHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const { t } = useI18n()
const router = useRouter()

const user = {
  name: 'Amanda Costa',
  username: '@amandacosta',
  avatar: 'https://i.pravatar.cc/150?img=32', // Higher res for profile
  banner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=400&fit=crop', // Party/Social vibe
  points: 356,
  bio: 'Amante de música eletrônica e festivais ao ar livre. Sempre pronta para a próxima festa! 💃✨',
  stats: {
    events: 42,
    following: 128,
    followers: 95,
  },
}

const activeNav = ref('profile')

const navItems = computed<NavItem[]>(() => [
  { id: 'home', label: t('feed.nav.home'), icon: 'home' },
  { id: 'top-events', label: t('feed.nav.topEvents'), icon: 'top' },
  { id: 'favorites', label: t('feed.nav.favorites'), icon: 'bookmark' },
  { id: 'profile', label: t('feed.nav.profile'), icon: 'profile' },
])

function handleNavSelect(id: string) {
  if (id === 'home' || id === 'top-events' || id === 'favorites') {
    router.push('/private/feed')
  }
}

const activeTab = ref('badges')
const tabs = [
  { id: 'badges', label: 'Conquistas' },
  { id: 'history', label: 'Histórico' },
  { id: 'settings', label: 'Preferências' },
]

const badges = [
  { icon: 'mdi-party-popper', color: '#FF4081', name: 'Party Animal', desc: 'Foi em 10 festas este mês' },
  { icon: 'mdi-map-marker-check', color: '#7C4DFF', name: 'Explorador', desc: 'Visitou 5 locais diferentes' },
  { icon: 'mdi-fire', color: '#FF9800', name: 'Em Chamas', desc: 'Sequência de 3 finais de semana seguidos' },
  { icon: 'mdi-crown', color: '#FFD700', name: 'VIP', desc: 'Membro premium da comunidade' },
]

</script>

<template>
  <div class="profile-page-layout">
    <FeedTopHeader :user="user" />

    <section class="layout-shell">
      <!-- Sidebar -->
      <FeedSidebarNav :active="activeNav" class="layout-sidebar" :items="navItems" @select="handleNavSelect" />

      <!-- Main Content -->
      <main class="layout-main">

        <!-- Profile Header Card -->
        <div class="profile-card">
          <div class="cover-image" :style="{ backgroundImage: `url(${user.banner})` }">
            <div class="overlay" />
          </div>

          <div class="profile-content">
            <div class="avatar-wrapper">
              <img :alt="user.name" class="avatar-img" :src="user.avatar">
              <div class="status-indicator" />
            </div>

            <div class="header-info">
              <div class="names">
                <h1>{{ user.name }}</h1>
                <span class="handle">{{ user.username }}</span>
              </div>
              <p class="bio">{{ user.bio }}</p>

              <div class="stats-row">
                <div class="stat-item">
                  <span class="stat-value">{{ user.stats.events }}</span>
                  <span class="stat-label">Eventos</span>
                </div>
                <div class="stat-divider" />
                <div class="stat-item">
                  <span class="stat-value">{{ user.stats.followers }}</span>
                  <span class="stat-label">Seguidores</span>
                </div>
                <div class="stat-divider" />
                <div class="stat-item">
                  <span class="stat-value">{{ user.stats.following }}</span>
                  <span class="stat-label">Seguindo</span>
                </div>
              </div>

              <div class="actions">
                <button class="edit-btn">Editar Perfil</button>
                <button class="share-btn">
                  <i class="mdi mdi-share-variant-outline" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Tabs -->
        <div class="content-tabs">
          <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id">
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-panel">

          <!-- Badges View -->
          <div v-if="activeTab === 'badges'" class="badges-grid">
            <div v-for="(badge, i) in badges" :key="i" class="badge-card">
              <div class="badge-icon" :style="{ background: `${badge.color}20`, color: badge.color }">
                <i class="mdi" :class="badge.icon" />
              </div>
              <div class="badge-info">
                <h3>{{ badge.name }}</h3>
                <p>{{ badge.desc }}</p>
              </div>
            </div>
          </div>

          <!-- History View Placeholder -->
          <div v-if="activeTab === 'history'" class="placeholder-view">
            <i class="mdi mdi-history" style="font-size: 3rem; color: #cbd5e1;" />
            <p>Seu histórico de eventos aparecerá aqui.</p>
          </div>

          <!-- Settings View Placeholder -->
          <div v-if="activeTab === 'settings'" class="settings-list">
            <div class="setting-item">
              <div class="setting-label">
                <i class="mdi mdi-bell-outline" />
                <span>Notificações</span>
              </div>
              <div class="toggle-switch checked" />
            </div>
            <div class="setting-item">
              <div class="setting-label">
                <i class="mdi mdi-theme-light-dark" />
                <span>Modo Escuro</span>
              </div>
              <div class="toggle-switch" />
            </div>
            <div class="setting-item text-red">
              <div class="setting-label">
                <i class="mdi mdi-logout" />
                <span>Sair da conta</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      <!-- Right Panel (Using simplified friends or trends) -->
      <aside class="layout-extras">
        <div class="level-card">
          <div class="level-header">
            <h3>Seu Nível</h3>
            <span class="points">{{ user.points }} pts</span>
          </div>
          <div class="progress-bar">
            <div class="fill" style="width: 75%" />
          </div>
          <p class="next-level">Faltam 144 pts para o nível "Festeiro Lendário"</p>
        </div>

        <!-- Suggestion of friends (static data) -->
        <div class="friends-box">
          <h3>Amigos Online</h3>
          <div class="friend-list">
            <div v-for="n in 4" :key="n" class="friend-row">
              <img class="friend-avatar" :src="`https://i.pravatar.cc/150?img=${n + 10}`">
              <div class="friend-info">
                <p>Nome do Amigo</p>
                <span>No evento: <strong>Sunset Party</strong></span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <AppFooter />
  </div>
</template>

<style scoped>
.profile-page-layout {
  min-height: 100vh;
  background: linear-gradient(142.35deg, rgba(252, 162, 89, 0.07) -1.66%, rgba(255, 98, 159, 0.11) 100.44%);
  display: flex;
  flex-direction: column;
  font-family: 'Baloo Thambi 2', sans-serif;
}

.layout-shell {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 240px minmax(0, 720px) 320px;
  grid-template-areas: 'sidebar main extras';
  column-gap: 2rem;
  row-gap: 0;
  width: min(100%, 1280px);
  margin: 0 auto 3.5rem;
  background: transparent;
  align-items: start;
}

.layout-sidebar {
  grid-area: sidebar;
  position: sticky;
  top: 120px;
}

.layout-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1.5rem;
}

.layout-extras {
  grid-area: extras;
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Profile Card Design */
.profile-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.cover-image {
  height: 140px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
}

.profile-content {
  padding: 0 1.5rem 1.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-top: -60px;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

.status-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #4CAF50;
  border: 3px solid white;
  border-radius: 50%;
}

.header-info h1 {
  font-size: 1.5rem;
  color: #2d2f55;
  margin: 0;
  line-height: 1.2;
}

.handle {
  color: #9aa0b8;
  font-size: 0.9rem;
  font-weight: 500;
}

.bio {
  margin: 1rem 0;
  color: #555b77;
  font-size: 0.95rem;
  max-width: 400px;
  line-height: 1.5;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d2f55;
}

.stat-label {
  font-size: 0.8rem;
  color: #9aa0b8;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #e0e2ed;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.edit-btn {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  border-radius: 99px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.25);
  transition: transform 0.2s;
}

.share-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e0e2ed;
  background: transparent;
  color: #555b77;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;
}

.edit-btn:hover {
  transform: translateY(-2px);
}

.share-btn:hover {
  border-color: #ff5fa6;
  color: #ff5fa6;
}

/* Tabs */
.content-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #ebeff7;
  padding-bottom: 2px;
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  font-weight: 600;
  color: #9aa0b8;
  cursor: pointer;
  position: relative;
  font-size: 1rem;
}

.tab-btn.active {
  color: #2d2f55;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 4px;
  background: #ff5fa6;
  border-radius: 4px;
}

/* Badges Grid */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.badge-card {
  background: white;
  padding: 1rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #f0f2f8;
}

.badge-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.badge-info h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #2d2f55;
}

.badge-info p {
  margin: 0;
  font-size: 0.75rem;
  color: #9aa0b8;
  line-height: 1.2;
}

/* Extras / Right Sidebar */
.level-card {
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.level-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #555b77;
}

.points {
  font-weight: 700;
  color: #ff5fa6;
}

.progress-bar {
  height: 8px;
  background: #f0f2f8;
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #ffba4b, #ff5fa6);
  border-radius: 99px;
}

.next-level {
  font-size: 0.75rem;
  color: #9aa0b8;
  margin: 0;
}

.friends-box {
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
}

.friends-box h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #2d2f55;
}

.friend-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.friend-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.friend-info p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d2f55;
}

.friend-info span {
  font-size: 0.75rem;
  color: #9aa0b8;
}

/* Placeholders & Settings */
.placeholder-view {
  text-align: center;
  padding: 3rem;
  color: #9aa0b8;
}

.settings-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f2f8;
  font-weight: 500;
  color: #555b77;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.setting-label i {
  font-size: 1.25rem;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: #e0e2ed;
  border-radius: 99px;
  position: relative;
  cursor: pointer;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-switch.checked {
  background: #4CAF50;
}

.toggle-switch.checked::after {
  transform: translateX(20px);
}

.text-red {
  color: #f43f5e;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 1240px) {
  .layout-shell {
    grid-template-columns: 220px 1fr;
    grid-template-areas: 'sidebar main';
    width: min(100%, 960px);
    padding: 0 2rem;
  }

  .layout-extras {
    display: none;
  }
}

@media (max-width: 960px) {
  .layout-shell {
    grid-template-columns: 1fr;
    grid-template-areas: 'main';
    width: 100%;
    padding: 1rem;
  }

  .layout-sidebar {
    display: none;
  }

  /* Bottom Nav handles it */
}
</style>
