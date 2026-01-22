<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { getEventById } from '@/api/event'
  import { useEventsStore } from '@/stores/events'
  import { useShareStore } from '@/stores/share'

  const props = defineProps<{
    eventId: string | string[]
  }>()

  const eventsStore = useEventsStore()

  type EventDetail = {
    id: string | number
    title: string
    date: string
    rawDate: Date | null
    location: string
    image: string
    description: string
    attractions: string[]
    contactInfo: string
    categories: string[]
    confirmedCount: number
    likes?: number
    organizer?: { name: string, avatar: string }
  }

  const fallbackImage = 'https://via.placeholder.com/1200x600?text=Evento'

  function resolveAsset (val?: string) {
    if (!val) return fallbackImage
    if (/^https?:\/\//i.test(val)) return val
    const base = (import.meta.env.VITE__BASE_URL || '').replace(/\/$/, '')
    const path = val.startsWith('/') ? val : `/${val}`
    return `${base}${path}`
  }

  const event = ref<EventDetail>({
    id: '',
    title: 'Carregando evento...',
    date: '',
    rawDate: null,
    location: '',
    image: fallbackImage,
    description: '',
    attractions: [],
    contactInfo: '',
    categories: [],
    confirmedCount: 0,
    likes: 0,
    organizer: { name: '', avatar: '' },
  })

  const loading = ref(false)
  const errorMessage = ref('')
  const showConfirmModal = ref(false)
  const isConfirmed = ref(false)
  const activeTab = ref<'info' | 'location' | 'lineup'>('info')

  // Countdown timer
  const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  function updateCountdown () {
    if (!event.value.rawDate) {
      countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
      return
    }

    const now = Date.now()
    const eventTime = event.value.rawDate.getTime()
    const distance = eventTime - now

    if (distance < 0) {
      countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
      return
    }

    countdown.value = {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    }
  }

  function startCountdown () {
    if (countdownInterval) clearInterval(countdownInterval)
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)
  }

  onUnmounted(() => {
    if (countdownInterval) clearInterval(countdownInterval)
  })

  function mapEventPayload (data: any): EventDetail {
    const rawDate = data?.date ? new Date(data.date) : null
    return {
      id: data?.id,
      title: data?.name || data?.title || 'Evento sem título',
      date: data?.date
        ? new Date(data.date).toLocaleString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        : data?.schedule || 'Data não informada',
      rawDate,
      location: data?.location || data?.address || data?.place || 'Local não informado',
      image: resolveAsset(data?.bannerUrl || data?.banner || data?.photos?.[0]),
      description: data?.description || 'Sem descrição disponível.',
      attractions: data?.attractions || data?.lineup || [],
      contactInfo: data?.contactInfo || 'Informações de contato não disponíveis.',
      categories: data?.categories || data?.tags || (data?.eventInterests || []).map((i: any) => i.interest?.name).filter(Boolean) || [],
      confirmedCount: data?.confirmedCount || data?.confirmed || 0,
      likes: data?.likes || data?._count?.likes || 0,
      organizer: {
        name: data?.organizer?.name || data?.hostName || data?.creator?.name || 'Organizador',
        avatar: data?.organizer?.avatar || data?.hostAvatar || data?.creator?.profileImage || '',
      },
    }
  }

  const isLiked = computed(() => eventsStore.isLiked(event.value.id))
  const isSaved = computed(() => eventsStore.isSaved(event.value.id))
  const displayLikes = computed(() => {
    return (event.value.likes || 0) + (isLiked.value ? 1 : 0)
  })

  const displayConfirmed = computed(() => {
    return event.value.confirmedCount + (isConfirmed.value ? 1 : 0)
  })

  const eventStatus = computed(() => {
    if (!event.value.rawDate) return 'upcoming'
    const now = new Date()
    const eventDate = event.value.rawDate
    if (eventDate < now) return 'past'
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 3) return 'soon'
    return 'upcoming'
  })

  // Avatar color logic
  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  ]

  const organizerAvatarColor = computed(() => {
    const name = event.value.organizer?.name || ''
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash) % avatarColors.length]
  })

  const organizerInitial = computed(() => {
    return (event.value.organizer?.name || 'O').charAt(0).toUpperCase()
  })

  function toggleLike () {
    if (event.value.id) {
      eventsStore.toggleLike(event.value.id)
    }
  }

  function toggleSave () {
    if (!event.value.id) return

    const feedItem = {
      id: event.value.id,
      banner: event.value.image,
      creator: event.value.organizer ? { name: event.value.organizer.name } : { name: 'Unknown' },
      hostAvatar: event.value.organizer ? event.value.organizer.avatar : '',
      schedule: event.value.date,
      location: event.value.location,
      title: event.value.title,
      description: event.value.description,
      confirmed: event.value.confirmedCount,
      interested: 0,
      likes: event.value.likes,
    }
    eventsStore.toggleSave(feedItem)
  }

  function handleConfirmAttendance () {
    showConfirmModal.value = true
  }

  function confirmAttendance () {
    isConfirmed.value = true
    showConfirmModal.value = false
  }

  async function fetchEventDetails (id: string | number) {
    loading.value = true
    errorMessage.value = ''
    try {
      const response = await getEventById(id)
      const payload = response?.data?.event || response?.data || response
      event.value = mapEventPayload(payload)
      startCountdown()
    } catch (error) {
      console.error(error)
      errorMessage.value = 'Não foi possível carregar os detalhes do evento.'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    if (id) fetchEventDetails(id)
  })

  watch(
    () => props.eventId,
    newId => {
      const id = Array.isArray(newId) ? newId[0] : newId
      if (id) fetchEventDetails(id)
    },
  )

  function openMap () {
    const loc = event.value?.location
    if (!loc) return
    const query = encodeURIComponent(loc)
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`
    window.open(url, '_blank', 'noopener')
  }

  const shareStore = useShareStore()

  function handleShare () {
    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    shareStore.open({
      title: event.value.title,
      text: event.value.description,
      url: `${window.location.origin}/private/event/${id}`,
    })
  }
</script>

<template>
  <div class="event-details-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-wrapper">
      <div class="loading-pulse">
        <div class="pulse-ring" />
        <div class="pulse-core" />
      </div>
      <p class="loading-text">Carregando evento incrível...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-wrapper">
      <div class="error-icon">
        <i class="mdi mdi-alert-circle-outline" />
      </div>
      <p class="error-text">{{ errorMessage }}</p>
      <button class="retry-btn" @click="fetchEventDetails(Array.isArray(eventId) ? (eventId[0] || '') : eventId)">
        <i class="mdi mdi-refresh" /> Tentar novamente
      </button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-image-wrapper">
          <img :alt="event.title" class="hero-image" :src="event.image">
          <div class="hero-overlay" />
          <div class="hero-gradient" />
        </div>

        <!-- Status Badge -->
        <div class="status-badge" :class="eventStatus">
          <i
            class="mdi"
            :class="{
              'mdi-clock-fast': eventStatus === 'soon',
              'mdi-calendar-check': eventStatus === 'upcoming',
              'mdi-check-circle': eventStatus === 'past'
            }"
          />
          <span>{{ eventStatus === 'soon' ? 'Em breve!' : eventStatus === 'past' ? 'Evento encerrado' : 'Confirmado'
          }}</span>
        </div>

        <!-- Floating Action Buttons -->
        <div class="floating-actions">
          <button class="fab-btn like-btn" :class="{ active: isLiked }" @click="toggleLike">
            <i class="mdi" :class="isLiked ? 'mdi-heart' : 'mdi-heart-outline'" />
            <span class="fab-count">{{ displayLikes }}</span>
          </button>

          <button class="fab-btn save-btn" :class="{ active: isSaved }" @click="toggleSave">
            <i class="mdi" :class="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'" />
          </button>

          <button class="fab-btn share-btn" @click="handleShare">
            <i class="mdi mdi-share-variant" />
          </button>
        </div>

        <!-- Hero Content -->
        <div class="hero-content">
          <div class="category-pills">
            <span v-for="cat in event.categories.slice(0, 3)" :key="cat" class="category-pill">
              {{ cat }}
            </span>
          </div>
          <h1 class="hero-title">{{ event.title }}</h1>
        </div>
      </div>

      <!-- Countdown Timer -->
      <div v-if="eventStatus !== 'past'" class="countdown-section">
        <div class="countdown-label">
          <i class="mdi mdi-timer-outline" />
          <span>Contagem regressiva</span>
        </div>
        <div class="countdown-grid">
          <div class="countdown-item">
            <span class="countdown-value">{{ String(countdown.days).padStart(2, '0') }}</span>
            <span class="countdown-unit">dias</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ String(countdown.hours).padStart(2, '0') }}</span>
            <span class="countdown-unit">horas</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ String(countdown.minutes).padStart(2, '0') }}</span>
            <span class="countdown-unit">min</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ String(countdown.seconds).padStart(2, '0') }}</span>
            <span class="countdown-unit">seg</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-icon likes">
            <i class="mdi mdi-heart" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ displayLikes }}</span>
            <span class="stat-label">curtidas</span>
          </div>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <div class="stat-icon confirmed">
            <i class="mdi mdi-account-check" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ displayConfirmed }}</span>
            <span class="stat-label">confirmados</span>
          </div>
        </div>
        <div class="stat-divider" />
        <div class="stat-item clickable" @click="handleShare">
          <div class="stat-icon share">
            <i class="mdi mdi-share-variant" />
          </div>
          <div class="stat-info">
            <span class="stat-label">Compartilhar</span>
          </div>
        </div>
      </div>

      <!-- Organizer Card -->
      <div class="organizer-card">
        <div class="organizer-avatar" :style="{ backgroundColor: organizerAvatarColor }">
          <template v-if="event.organizer?.avatar">
            <img :alt="event.organizer.name" :src="event.organizer.avatar">
          </template>
          <template v-else>
            {{ organizerInitial }}
          </template>
        </div>
        <div class="organizer-info">
          <span class="organizer-label">Organizado por</span>
          <span class="organizer-name">{{ event.organizer?.name }}</span>
        </div>
        <button class="follow-btn">
          <i class="mdi mdi-plus" /> Seguir
        </button>
      </div>

      <!-- Content Tabs -->
      <div class="content-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <i class="mdi mdi-information-outline" />
          <span>Informações</span>
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'location' }" @click="activeTab = 'location'">
          <i class="mdi mdi-map-marker-outline" />
          <span>Local</span>
        </button>
        <button
          v-if="event.attractions.length > 0"
          class="tab-btn"
          :class="{ active: activeTab === 'lineup' }"
          @click="activeTab = 'lineup'"
        >
          <i class="mdi mdi-star-outline" />
          <span>Atrações</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Info Tab -->
        <div v-show="activeTab === 'info'" class="tab-panel info-panel">
          <div class="info-card">
            <div class="info-header">
              <i class="mdi mdi-calendar-clock" />
              <span>Data e Horário</span>
            </div>
            <p class="info-value">{{ event.date }}</p>
          </div>

          <div class="info-card description-card">
            <div class="info-header">
              <i class="mdi mdi-text-box-outline" />
              <span>Sobre o Evento</span>
            </div>
            <p class="description-text">{{ event.description }}</p>
          </div>

          <div class="info-card">
            <div class="info-header">
              <i class="mdi mdi-help-circle-outline" />
              <span>Dúvidas e Contato</span>
            </div>
            <p class="info-value">{{ event.contactInfo }}</p>
          </div>
        </div>

        <!-- Location Tab -->
        <div v-show="activeTab === 'location'" class="tab-panel location-panel">
          <div class="location-card-modern">
            <div class="location-icon-wrapper">
              <i class="mdi mdi-map-marker" />
            </div>
            <div class="location-details">
              <span class="location-label">Endereço do evento</span>
              <p class="location-address">{{ event.location }}</p>
            </div>
          </div>

          <button class="map-button" @click="openMap">
            <i class="mdi mdi-google-maps" />
            <span>Abrir no Google Maps</span>
            <i class="mdi mdi-arrow-right" />
          </button>
        </div>

        <!-- Lineup Tab -->
        <div v-show="activeTab === 'lineup'" class="tab-panel lineup-panel">
          <div
            v-for="(attraction, index) in event.attractions"
            :key="index"
            class="lineup-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="lineup-number">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="lineup-info">
              <span class="lineup-name">{{ attraction }}</span>
            </div>
            <div class="lineup-icon">
              <i class="mdi mdi-microphone-variant" />
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="cta-section">
        <div class="cta-info">
          <span class="cta-label">{{ isConfirmed ? 'Você confirmou presença!' : 'Garanta sua vaga!' }}</span>
          <span class="cta-sub">{{ displayConfirmed }} pessoas confirmadas</span>
        </div>
        <button class="cta-button" :class="{ confirmed: isConfirmed }" @click="handleConfirmAttendance">
          <i class="mdi" :class="isConfirmed ? 'mdi-check-circle' : 'mdi-party-popper'" />
          <span>{{ isConfirmed ? 'CONFIRMADO!' : 'EU VOU!' }}</span>
        </button>
      </div>

      <!-- Legal Links -->
      <div class="legal-section">
        <a href="#">Termos de uso</a>
        <span class="legal-dot">•</span>
        <a href="#">Política de privacidade</a>
      </div>
    </template>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
          <div class="modal-content">
            <div class="modal-icon">
              <i class="mdi mdi-party-popper" />
            </div>
            <h3 class="modal-title">Confirmar Presença</h3>
            <p class="modal-text">Você está prestes a confirmar sua presença em <strong>{{ event.title }}</strong>!</p>
            <div class="modal-actions">
              <button class="modal-btn cancel" @click="showConfirmModal = false">Cancelar</button>
              <button class="modal-btn confirm" @click="confirmAttendance">
                <i class="mdi mdi-check" /> Confirmar!
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.event-details-container {
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  font-family: 'Poppins', sans-serif;
  position: relative;
}

/* Loading State */
.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 400px;
}

.loading-pulse {
  position: relative;
  width: 80px;
  height: 80px;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #ff5fa6;
  border-right-color: #ffba4b;
  animation: spin 1s linear infinite;
}

.pulse-core {
  position: absolute;
  inset: 15px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-text {
  margin-top: 1.5rem;
  color: #666;
  font-weight: 500;
  animation: fadeInOut 1.5s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(0.8);
    opacity: 0.7;
  }
}

@keyframes fadeInOut {

  0%,
  100% {
    opacity: 0.5;
  }

  50% {
    opacity: 1;
  }
}

/* Error State */
.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 400px;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  color: #ff5fa6;
  margin-bottom: 1rem;
}

.error-text {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 95, 166, 0.3);
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 380px;
  overflow: hidden;
}

.hero-image-wrapper {
  position: absolute;
  inset: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.event-details-container:hover .hero-image {
  transform: scale(1.03);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 50%,
      rgba(0, 0, 0, 0.7) 100%);
}

.hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: linear-gradient(to top,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0) 100%);
}

/* Status Badge */
.status-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
  animation: slideInLeft 0.5s ease;
}

.status-badge.upcoming {
  background: rgba(76, 175, 80, 0.9);
  color: white;
}

.status-badge.soon {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  animation: slideInLeft 0.5s ease, glow 2s ease-in-out infinite;
}

.status-badge.past {
  background: rgba(158, 158, 158, 0.9);
  color: white;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes glow {

  0%,
  100% {
    box-shadow: 0 0 5px rgba(255, 95, 166, 0.5);
  }

  50% {
    box-shadow: 0 0 20px rgba(255, 95, 166, 0.8), 0 0 30px rgba(255, 186, 75, 0.5);
  }
}

/* Floating Action Buttons */
.floating-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  position: relative;
}

.fab-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.fab-btn.like-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5fa6 100%);
  color: white;
}

.fab-btn.like-btn.active i {
  animation: heartBeat 0.6s ease;
}

.fab-btn.save-btn.active {
  background: linear-gradient(135deg, #ffba4b 0%, #ffa502 100%);
  color: white;
}

.fab-count {
  position: absolute;
  bottom: -8px;
  right: -8px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.4);
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }

  25% {
    transform: scale(1.3);
  }

  50% {
    transform: scale(1);
  }

  75% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

/* Hero Content */
.hero-content {
  position: absolute;
  bottom: 30px;
  left: 24px;
  right: 24px;
  z-index: 2;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.category-pill {
  padding: 0.35rem 0.9rem;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
  margin: 0;
}

/* Countdown Section */
.countdown-section {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.1) 0%, rgba(255, 95, 166, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 95, 166, 0.1);
}

.countdown-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.9rem;
}

.countdown-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.1);
  min-width: 60px;
}

.countdown-value {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.countdown-unit {
  font-size: 0.7rem;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

.countdown-separator {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff5fa6;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

/* Stats Bar */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1.25rem;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-item.clickable {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  transition: background 0.2s;
}

.stat-item.clickable:hover {
  background: rgba(255, 95, 166, 0.1);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.stat-icon.likes {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 95, 166, 0.15) 100%);
  color: #ff5fa6;
}

.stat-icon.confirmed {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%);
  color: #4CAF50;
}

.stat-icon.share {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(100, 181, 246, 0.15) 100%);
  color: #2196F3;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.15rem;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #e0e0e0, transparent);
}

/* Organizer Card */
.organizer-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  margin: 1rem 1.25rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 95, 166, 0.1);
}

.organizer-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.organizer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.organizer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.organizer-label {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.organizer-name {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
}

.follow-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 1.25rem;
  border: 2px solid #ff5fa6;
  border-radius: 50px;
  background: transparent;
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background: #ff5fa6;
  color: white;
  transform: scale(1.05);
}

/* Content Tabs */
.content-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0 1.25rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.content-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 12px;
  background: #f5f5f5;
  color: #666;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: rgba(255, 95, 166, 0.1);
  color: #ff5fa6;
}

.tab-btn.active {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
}

/* Tab Content */
.tab-content {
  padding: 0 1.25rem;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Info Panel */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card {
  padding: 1.25rem;
  background: #fafafa;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.info-card:hover {
  border-color: rgba(255, 95, 166, 0.2);
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.08);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.9rem;
}

.info-header i {
  font-size: 1.2rem;
}

.info-value {
  color: #444;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.description-card {
  background: linear-gradient(135deg, #fff5f8 0%, #f8f9ff 100%);
}

.description-text {
  color: #555;
  font-size: 0.95rem;
  line-height: 1.8;
  margin: 0;
}

/* Location Panel */
.location-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.location-card-modern {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%);
  border-radius: 20px;
  border: 1px solid rgba(255, 95, 166, 0.1);
}

.location-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(255, 95, 166, 0.25);
}

.location-details {
  flex: 1;
}

.location-label {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 0.5rem;
}

.location-address {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.5;
}

.map-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
}

.map-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 133, 244, 0.4);
}

.map-button i:last-child {
  transition: transform 0.3s ease;
}

.map-button:hover i:last-child {
  transform: translateX(5px);
}

/* Lineup Panel */
.lineup-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lineup-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  animation: slideInRight 0.5s ease backwards;
}

.lineup-card:hover {
  transform: translateX(8px);
  border-color: rgba(255, 95, 166, 0.3);
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.1);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.lineup-number {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  min-width: 40px;
}

.lineup-info {
  flex: 1;
}

.lineup-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.lineup-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.15) 0%, rgba(255, 95, 166, 0.15) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5fa6;
  font-size: 1.1rem;
}

/* CTA Section */
.cta-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.25rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, #fff5f8 0%, #f8f9ff 100%);
  border-top: 1px solid rgba(255, 95, 166, 0.1);
}

.cta-info {
  display: flex;
  flex-direction: column;
}

.cta-label {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
}

.cta-sub {
  font-size: 0.85rem;
  color: #888;
}

.cta-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 25px rgba(255, 95, 166, 0.35);
}

.cta-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 35px rgba(255, 95, 166, 0.45);
}

.cta-button:active {
  transform: translateY(0) scale(0.98);
}

.cta-button.confirmed {
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.35);
}

.cta-button.confirmed:hover {
  box-shadow: 0 12px 35px rgba(76, 175, 80, 0.45);
}

/* Legal Section */
.legal-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #fafafa;
}

.legal-section a {
  color: #888;
  font-size: 0.8rem;
  text-decoration: none;
  transition: color 0.2s;
}

.legal-section a:hover {
  color: #ff5fa6;
}

.legal-dot {
  color: #ccc;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  animation: bounce 0.6s ease;
}

@keyframes bounce {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.75rem;
}

.modal-text {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.modal-btn {
  flex: 1;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.modal-btn.cancel {
  background: #f0f0f0;
  color: #666;
}

.modal-btn.cancel:hover {
  background: #e0e0e0;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
}

.modal-btn.confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 95, 166, 0.4);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}

/* Responsive */
@media (max-width: 640px) {
  .hero-section {
    height: 320px;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-content {
    bottom: 20px;
    left: 16px;
    right: 16px;
  }

  .floating-actions {
    top: 16px;
    right: 16px;
  }

  .fab-btn {
    width: 42px;
    height: 42px;
    font-size: 1.1rem;
  }

  .countdown-item {
    padding: 0.5rem 0.75rem;
    min-width: 50px;
  }

  .countdown-value {
    font-size: 1.4rem;
  }

  .stats-bar {
    padding: 1rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .organizer-card {
    margin: 1rem;
    padding: 1rem;
  }

  .content-tabs {
    padding: 0 1rem;
  }

  .tab-content {
    padding: 0 1rem;
  }

  .cta-section {
    flex-direction: column;
    text-align: center;
    padding: 1.25rem 1rem;
  }

  .cta-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-section {
    height: 280px;
  }

  .status-badge {
    top: 12px;
    left: 12px;
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }

  .category-pills {
    gap: 0.35rem;
  }

  .category-pill {
    font-size: 0.65rem;
    padding: 0.25rem 0.65rem;
  }

  .countdown-grid {
    gap: 0.25rem;
  }

  .countdown-item {
    padding: 0.4rem 0.5rem;
    min-width: 45px;
  }

  .countdown-value {
    font-size: 1.2rem;
  }

  .countdown-unit {
    font-size: 0.6rem;
  }

  .countdown-separator {
    font-size: 1.2rem;
  }
}
</style>
