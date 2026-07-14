<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { isRequestCanceled, unwrapList } from '@/api'
import { requestFollowUser, requestUnFollowUser } from '@/api/follows'
import { getUserRecomendations, searchUsers } from '@/api/users'
import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
import SearchInput from '@/components/UI/SearchInput/SearchInput.vue'
import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
import { type StrokeLinecap, type StrokeLinejoin, svgIcons } from '@/utils/svgSet'

// i18n
const { t } = useI18n()
const router = useRouter()

// Modelo de dados do usuário listado para convite
export interface User {
  id: number | string
  name: string
  username?: string
  profileImage?: string
  isFollowing: boolean
  currentStatus?: string
}

// Estado reativo
const searchQuery = ref('')
const users = ref<User[]>([])
const recommendedUsers = ref<User[]>([]) // Cache das recomendações iniciais
const isLoading = ref(false)
const isSearching = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// Snackbar
const snackbarVisible = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('#ff9800')

function showSnackbar(message: string, color = '#ff9800') {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbarVisible.value = true
}

// Gera avatar placeholder com iniciais
function getAvatarUrl(user: User): string {
  if (user.profileImage) {
    // Se começa com http ou https, usa direto
    if (user.profileImage.startsWith('http')) {
      return user.profileImage
    }
    // Se não, assume que é relativo ao baseURL da API
    const baseUrl = import.meta.env.VITE__BASE_URL || ''
    return `${baseUrl}${user.profileImage}`
  }
  // Retorna URL vazia para usar o placeholder CSS
  return ''
}

// Pega as iniciais do nome do usuário
function getUserInitials(user: User): string {
  const name = user.name || user.username || '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2 && parts[0] && parts.at(-1)) {
    const first = parts[0][0] || ''
    const last = parts.at(-1)?.[0] || ''
    return (first + last).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Cor do avatar baseado no ID
function getAvatarColor(user: User): string {
  const colors = [
    '#FF5FA6', '#FFC25B', '#A78BFA', '#60A5FA', '#34D399',
    '#F87171', '#FBBF24', '#A3E635', '#2DD4BF', '#818CF8',
  ]
  const id = typeof user.id === 'string' ? Number.parseInt(user.id) : user.id
  return colors[id % colors.length] ?? '#FF5FA6'
}

async function followUser(user: User) {
  try {
    await requestFollowUser(user)
    showSnackbar(`Você começou a seguir ${user.name}`, '#22c55e')
  } catch (error: any) {
    console.error('Erro ao seguir usuário:', error)
    showSnackbar(error?.response?.data?.message || 'Erro ao seguir usuário', '#ef4444')
    // Reverte o estado em caso de erro
    user.isFollowing = false
  }
}

async function unFollowUser(user: User) {
  try {
    await requestUnFollowUser(user)
    showSnackbar(`Você deixou de seguir ${user.name}`, '#6b7280')
  } catch (error: any) {
    console.error('Erro ao deixar de seguir usuário:', error)
    showSnackbar(error?.response?.data?.message || 'Erro ao deixar de seguir', '#ef4444')
    // Reverte o estado em caso de erro
    user.isFollowing = true
  }
}

async function requestUserRecomendations() {
  try {
    isLoading.value = true
    hasError.value = false
    errorMessage.value = ''

    const response = await getUserRecomendations()

    // Extrai os usuários da resposta (unwrapList aceita os envelopes conhecidos)
    const userData = unwrapList<any>(response, 'users')

    // Mapeia para o formato esperado
    users.value = userData.map((u: any) => ({
      id: u.id || u._id,
      name: u.name || u.username || 'Usuário',
      username: u.username,
      profileImage: u.profileImage || u.profilePhoto || u.avatar || u.photo,
      isFollowing: u.isFollowing || u.following || false,
      currentStatus: u.currentStatus || u.status,
    }))

    // Salva as recomendações para restaurar quando limpar a busca
    recommendedUsers.value = [...users.value]

    if (users.value.length === 0) {
      errorMessage.value = 'Nenhum usuário encontrado no momento'
    }
  } catch (error: any) {
    console.error('❌ Erro ao buscar recomendações de usuários:', error)
    hasError.value = true
    errorMessage.value = error?.response?.data?.message || 'Erro ao carregar usuários'
    showSnackbar(errorMessage.value, '#ef4444')
  } finally {
    isLoading.value = false
  }
}

// Cancela a busca anterior quando uma nova é disparada (evita respostas fora de ordem)
let userSearchCtrl: AbortController | null = null

async function performSearch(query: string) {
  if (!query.trim()) {
    // Quando limpar a busca, restaura as recomendações iniciais (sem nova requisição)
    userSearchCtrl?.abort()
    users.value = [...recommendedUsers.value]
    isSearching.value = false
    hasError.value = false
    errorMessage.value = ''
    return
  }

  // Limpa resultados anteriores e ativa loading ao iniciar nova busca
  users.value = []
  isSearching.value = true
  hasError.value = false
  errorMessage.value = ''

  // Aborta a busca anterior antes de disparar a nova
  userSearchCtrl?.abort()
  userSearchCtrl = new AbortController()
  const { signal } = userSearchCtrl

  try {
    const response = await searchUsers(query.trim(), 1, 20, signal)

    // Extrai os usuários da resposta (unwrapList aceita os envelopes conhecidos)
    const userData = unwrapList<any>(response, 'users')

    users.value = userData.map((u: any) => ({
      id: u.id || u._id,
      name: u.name || u.username || 'Usuário',
      username: u.username,
      profileImage: u.profileImage || u.profilePhoto || u.avatar || u.photo,
      isFollowing: u.isFollowing || u.following || false,
      currentStatus: u.currentStatus || u.status,
    }))

    if (users.value.length === 0) {
      errorMessage.value = `Nenhum usuário encontrado para "${query}"`
    }
    isSearching.value = false
  } catch (error: any) {
    // Requisição substituída por outra mais recente: mantém o loading do request atual
    if (isRequestCanceled(error)) return

    console.error('❌ Erro ao buscar usuários:', error)
    hasError.value = true
    users.value = []

    // Mensagem de erro sem fallback
    errorMessage.value = error?.response?.status === 404 || error?.message?.includes('404')
      ? 'Endpoint de busca não disponível. Aguarde implementação no backend.'
      : error?.response?.data?.message || 'Erro ao buscar usuários'
    showSnackbar(errorMessage.value, '#ef4444')
    isSearching.value = false
  }
}

// Ativa o loading imediatamente ao digitar, antes do debounce do SearchInput disparar,
// para evitar que o estado vazio apareça durante a janela de debounce.
watch(searchQuery, (newValue) => {
  if (newValue.trim()) {
    isSearching.value = true
  } else {
    isSearching.value = false
    users.value = [...recommendedUsers.value]
    hasError.value = false
    errorMessage.value = ''
  }
})

// Handler para o evento search do SearchInput (já com debounce)
function handleSearch(query: string) {
  if (!query.trim()) {
    // Quando limpar a busca, restaura recomendações iniciais sem nova requisição
    isSearching.value = false
    users.value = [...recommendedUsers.value]
    hasError.value = false
    errorMessage.value = ''
    return
  }

  isSearching.value = true
  performSearch(query)
}

// Handler para limpar a busca
function handleClearSearch() {
  users.value = [...recommendedUsers.value]
  isSearching.value = false
  hasError.value = false
  errorMessage.value = ''
}

// Filtro de usuários por nome (case-insensitive) - Local apenas
const filteredUsers = computed(() => {
  return users.value
})

// Alterna status do convite (atualização otimista)
function toggleInvite(user: User) {
  const previousState = user.isFollowing

  // Atualização otimista
  user.isFollowing = !user.isFollowing

  if (previousState) {
    unFollowUser(user)
  } else {
    followUser(user)
  }
}

function finishSelection() {
  router.push('/public/Congratulations')
}

function skipStep() {
  router.push('/public/Congratulations')
}

// Refaz a última ação (busca ou recomendações)
function retryLastAction() {
  if (searchQuery.value.trim()) {
    performSearch(searchQuery.value)
  } else {
    requestUserRecomendations()
  }
}

onMounted(() => {
  requestUserRecomendations()
})

</script>

<template>
  <AuthLayout>
    <template #form-content>
      <!-- Botão de Voltar -->
      <button class="btn-back" type="button" @click="router.back()">
        <svg class="btn-back__arrow" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>Voltar</span>
      </button>
      <h2 class="mobile-brand-title notranslate" translate="no">WE PARTY</h2>
      <!-- Título e subtítulo -->
      <h1 class="auth-title">
        {{ t('addFriends.title') }}
      </h1>
      <p class="auth-subtitle">
        {{ t('addFriends.subtitle') }}
      </p>
      <div class="search-input-wrapper">
        <SearchInput v-model="searchQuery" :loading="isSearching" :placeholder="t('addFriends.searchPlaceholder')"
          @clear="handleClearSearch" @search="handleSearch" />
      </div>

      <!-- Estado de loading (load inicial e durante a busca) -->
      <div v-if="isLoading || isSearching" class="loading-state">
        <AppLoader size="md" text="Carregando..." />
      </div>

      <!-- Estado de erro -->
      <div v-else-if="hasError && users.length === 0" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" type="button" @click="retryLastAction">
          Tentar novamente
        </button>
      </div>

      <!-- Estado vazio -->
      <div v-else-if="!isLoading && !isSearching && users.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>{{ errorMessage || 'Nenhum usuário disponível' }}</h3>
        <p v-if="searchQuery">Tente buscar por outro nome</p>
      </div>

      <!-- Lista de usuários -->
      <ul v-else class="user-list">
        <li v-for="user in filteredUsers" :key="user.id" class="user-item">
          <div class="avatar-wrapper">
            <img v-if="getAvatarUrl(user)" :alt="user.name" class="avatar" :src="getAvatarUrl(user)"
              @error="($event.target as HTMLImageElement).style.display = 'none'">
            <div v-if="!getAvatarUrl(user)" class="avatar-placeholder"
              :style="{ backgroundColor: getAvatarColor(user) }">
              {{ getUserInitials(user) }}
            </div>
          </div>
          <div class="user-info">
            <span class="name">{{ user.name }}</span>
            <span v-if="user.username" class="username">@{{ user.username }}</span>
          </div>
          <button :class="['invite-btn', user.isFollowing ? 'sent' : 'send']" type="button" @click="toggleInvite(user)">
            <svg v-if="!user.isFollowing" class="follow-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" stroke-linecap="round" />
              <line x1="22" y1="11" x2="16" y2="11" stroke-linecap="round" />
            </svg>
            <svg v-else class="follow-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ user.isFollowing ? t('addFriends.sent') : t('addFriends.send') }}
          </button>
        </li>
      </ul>

      <button class="btn-primary" @click="finishSelection">
        {{ t('addFriends.finishButton') }}
      </button>

      <div class="skip-container">
        <a class="skip-link" href="#" @click.prevent="skipStep"><span>Pular esta etapa por enquanto</span></a>
      </div>
    </template>

    <template #brand-content>
      <!-- Seção de informações (direita) -->
      <div class="info-section">
        <div class="info-content">
          <h2 class="info-title">
            {{ t('addFriends.infoTitle').replace('?', '') }}<span class="question-mark">?</span>
          </h2>
          <ul>
            <li>{{ t('addFriends.infoPoint1') }}</li>
            <li>{{ t('addFriends.infoPoint2') }}</li>
            <li>{{ t('addFriends.infoPoint3') }}</li>
          </ul>
        </div>
      </div>
    </template>
  </AuthLayout>

  <!-- Snackbar para feedback -->
  <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="4000" />
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Baloo+Thambi+2:wght@800&family=Poppins:wght@400;500;600;700&display=swap');

.mobile-brand-title {
  display: none;
}

/* ===============================
   BOTÃO VOLTAR
================================ */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px 10px 12px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #FFC25B 0%, #FF5FA6 100%);
  box-shadow: 0 4px 14px rgba(255, 95, 166, 0.28);
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 40px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-back:hover {
  transform: translateX(-3px);
  box-shadow: 0 6px 20px rgba(255, 95, 166, 0.42);
}

.btn-back:active {
  transform: translateX(-1px);
}

.btn-back__arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.btn-back:hover .btn-back__arrow {
  transform: translateX(-3px);
}

/* Tema rosa para InputLabel dentro desta página */
.il-theme--pink {
  --il-border-neutral: #F0F0F0;
  /* neutra */
  --il-border-filled: #FBC0D6;
  /* preenchido rosa claro */
  --il-border-focus: #F978A3;
  /* foco rosa */
  --il-label-active: #F7A4C0;
  /* label ativo rosa suave */
  --il-text: #072961;
  /* texto */
  --il-focus-halo: rgba(249, 120, 163, 0.20);
  /* halo rosa */
}

.auth-title {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
  text-align: left;
  margin-left: 0;
}

.auth-subtitle {
  margin-bottom: 2rem;
  text-align: left;
  margin-left: 0;
}

.search-input-wrapper {
  margin-bottom: 2rem;
}

/* Estados de loading, erro e vazio */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  gap: 1rem;
}

.loading-state p,
.error-state p,
.empty-state p {
  color: #6B7280;
  font-size: 0.95rem;
  margin: 0;
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.empty-state h3 {
  color: #1F2937;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.retry-btn:hover {
  transform: translateY(-2px);
}

.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  max-height: 400px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Avatar wrapper e placeholder */
.avatar-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #E5E7EB;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.name {
  font-weight: 600;
  color: #1F2937;
  font-size: 0.95rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username {
  font-size: 0.8rem;
  color: #6B7280;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.invite-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem 1.2rem;
  min-width: 120px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.follow-icon {
  width: 0.95rem;
  height: 0.95rem;
  color: inherit;
  flex-shrink: 0;
}

.invite-btn.send {
  color: #F978A3;
  border: 1.5px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #FFC947 0%, #F978A3 100%) border-box;
}

.invite-btn.send:hover {
  box-shadow: none;
}

.invite-btn.sent {
  border: none;
  background: linear-gradient(90deg, #FFC947 0%, #F978A3 100%);
  background-size: 100% 100%;
  color: #fff;
  box-shadow: 0 10px 18px rgba(249, 120, 163, 0.25);
}

.invite-btn.sent:hover {
  box-shadow: 0 12px 22px rgba(249, 120, 163, 0.3);
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(252, 149, 89, 0.4);
}

.skip-container {
  margin-top: 1.5rem;
  text-align: center;
}

.skip-link {
  font-weight: 600;
  color: #f97316;
  text-decoration: none;
  transition: color 0.2s ease;
}

.skip-link:hover {
  text-decoration: underline;
}

.skip-link:hover span {
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* SEÇÃO DE INFORMAÇÕES (DIREITA) -  */
.info-section {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: none;
  overflow: hidden;
}

.info-content {
  position: relative;
  z-index: 10;
  max-width: 500px;
}

.info-title {
  font-family: 'Baloo Thambi 2', cursive;
  font-weight: 800;
  font-size: 3.5rem;
  line-height: 1.2;
  color: #4F4F4F;
  margin-bottom: 2.5rem;
}

.question-mark {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: #F978A3;
  color: #fff;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 2.5rem;
  margin-left: 0.5rem;
  transform: translateY(-5px);
}

.info-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-content li {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  line-height: 1.6;
  color: #4F4F4F;
  display: flex;
  align-items: center;
}

.info-content li::before {
  content: '•';
  color: #F978A3;
  font-size: 2rem;
  margin-right: 1.5rem;
  line-height: 0;
}

@media (max-width: 960px) {
  .info-section {
    padding: 2rem;
    text-align: center;
  }

  .info-title {
    font-size: 2.5rem;
    margin-bottom: 2rem;
  }

  .info-content ul {
    gap: 1rem;
    align-items: center;
  }

  .info-content li {
    font-size: 1.1rem;
    justify-content: center;
  }

  .info-content li::before {
    margin-right: 1rem;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 1.75rem;
    text-align: center;
  }

  .subtitle {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .search-wrapper {
    margin-bottom: 1.5rem;
  }

  .search-input {
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
    padding: 0.85rem 3.1rem;
    font-size: 0.9rem;
  }

  .search-icon {
    left: 1.1rem;
    width: 1.1rem;
    height: 1.1rem;
    color: #94A3B8;
  }

  .filter-btn {
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    background: #fff;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  }

  .user-list {
    gap: 0.85rem;
  }

  .user-item {
    background: #fff;
    border-radius: 18px;
    padding: 0.85rem 1rem;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  }

  .avatar {
    width: 52px;
    height: 52px;
  }

  .name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #111827;
  }

  .invite-btn {
    min-width: 140px;
    padding: 0.55rem 1.25rem;
  }
}

@media (max-width: 480px) {
  .info-title {
    font-size: 2rem;
  }

  .question-mark {
    width: 40px;
    height: 40px;
    font-size: 2rem;
  }

  .info-content li {
    font-size: 1rem;
  }

  .user-item {
    padding: 0.75rem 0.9rem;
  }

  .avatar {
    width: 48px;
    height: 48px;
  }

  .invite-btn {
    min-width: 120px;
    padding: 0.5rem 1.1rem;
    font-size: 0.82rem;
  }
}

@media (max-width: 960px) {
  .mobile-brand-title {
    display: block;
    margin-bottom: 0.75rem;
    font-family: 'Baloo Thambi 2', cursive;
    font-weight: 800;
    font-size: 2.75rem;
    line-height: 1.1;
    text-transform: uppercase;
    background: linear-gradient(to right, #FFC947, #F978A3);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-align: center;
  }
}
</style>
