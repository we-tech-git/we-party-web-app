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

function resolveAsset(val?: string) {
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
const activeTab = ref<'info' | 'location' | 'lineup'>('info')

// FAQs state
const openFaqIndex = ref<number | null>(null)
const showFaqs = ref(false)

// Terms and Privacy Modal
const showTermsModal = ref(false)
const termsModalPdf = ref<'terms' | 'privacy'>('terms')

function openTermsModal(type: 'terms' | 'privacy') {
  termsModalPdf.value = type
  showTermsModal.value = true
}

const faqs = ref([
  {
    icon: 'mdi-ticket-confirmation-outline',
    question: 'Como faço para adquirir meu ingresso?',
    answer: 'Os ingressos podem ser adquiridos diretamente nesta página. Após a confirmação, você receberá um e-mail com o QR Code para entrada no evento. Você também pode salvar o ingresso na sua carteira digital.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    icon: 'mdi-calendar-clock',
    question: 'Qual o horário de abertura dos portões?',
    answer: 'Os portões abrem 2 horas antes do horário oficial do evento. Recomendamos chegar com antecedência para evitar filas e aproveitar ao máximo a experiência.',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    icon: 'mdi-food-fork-drink',
    question: 'Posso levar comida e bebida?',
    answer: 'Por questões de segurança, não é permitida a entrada com alimentos e bebidas. O evento contará com diversos food trucks e barracas com opções variadas de gastronomia. Garrafas de água lacradas são permitidas.',
    gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  },
  {
    icon: 'mdi-car-multiple',
    question: 'O local oferece estacionamento?',
    answer: 'Sim! Temos estacionamento próprio com mais de 500 vagas. O valor é de R$ 30,00 e pode ser pago no local (dinheiro ou cartão). Também recomendamos o uso de aplicativos de transporte para sua comodidade.',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    icon: 'mdi-account-multiple-check',
    question: 'Menores de idade podem participar?',
    answer: 'Este evento é classificado para maiores de 18 anos. Menores entre 16-17 anos podem entrar acompanhados dos pais ou responsáveis legais com autorização autenticada. Crianças até 12 anos não pagam ingresso quando acompanhadas.',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    icon: 'mdi-weather-partly-cloudy',
    question: 'E se chover? O evento será cancelado?',
    answer: 'O evento acontece com chuva ou sol! Possuímos áreas cobertas e toda estrutura preparada para qualquer condição climática. Em caso de condições extremas, informaremos através dos nossos canais oficiais e redes sociais.',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
])

function toggleFaq(index: number) {
  openFaqIndex.value = openFaqIndex.value === index ? null : index
}

// Countdown timer
const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
let countdownInterval: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
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

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval)
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
}

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

function resolveEventDate(data: any): Date | null {
  const candidates = [
    data?.date,
    data?.startDate,
    data?.dateTime,
    data?.startAt,
    data?.eventDate,
    data?.start_date,
    data?.schedule,
  ]
  for (const val of candidates) {
    if (!val) continue
    const parsed = new Date(val)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return null
}

function formatEventDate(d: Date | null): string {
  if (!d) return 'Data não informada'
  return d.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapEventPayload(data: any): EventDetail {
  const rawDate = resolveEventDate(data)
  return {
    id: data?.id,
    title: data?.name || data?.title || 'Evento sem título',
    date: formatEventDate(rawDate),
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
const isConfirmed = computed(() => eventsStore.isConfirmed(event.value.id))
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

const isEventPast = computed(() => eventStatus.value === 'past')

function toggleLike() {
  if (event.value.id && !isEventPast.value) {
    eventsStore.toggleLike(event.value.id)
  }
}

function toggleSave() {
  if (!event.value.id || isEventPast.value) return

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

function handleConfirmAttendance() {
  if (isEventPast.value) return

  if (isConfirmed.value) {
    // Se já confirmou, desconfirma direto
    eventsStore.toggleConfirm(event.value.id)
  } else {
    showConfirmModal.value = true
  }
}

function confirmAttendance() {
  eventsStore.toggleConfirm(event.value.id)
  showConfirmModal.value = false
}

async function fetchEventDetails(id: string | number) {
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

function openMap() {
  const loc = event.value?.location
  if (!loc) return
  const query = encodeURIComponent(loc)
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`
  window.open(url, '_blank', 'noopener')
}

const shareStore = useShareStore()

function handleShare() {
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
          <i class="mdi" :class="{
            'mdi-clock-fast': eventStatus === 'soon',
            'mdi-calendar-check': eventStatus === 'upcoming',
            'mdi-check-circle': eventStatus === 'past'
          }" />
          <span>{{ eventStatus === 'soon' ? 'Em breve!' : eventStatus === 'past' ? 'Evento encerrado' : 'Confirmado'
          }}</span>
        </div>

        <!-- Floating Action Buttons -->
        <div class="floating-actions">
          <button class="fab-btn like-btn" :class="{ active: isLiked, disabled: isEventPast }" :disabled="isEventPast"
            @click="toggleLike">
            <img src="/confetti.svg" alt="Confetti" class="fab-icon" />
            <span class="fab-count">{{ displayLikes }}</span>
          </button>

          <button class="fab-btn save-btn" :class="{ active: isSaved, disabled: isEventPast }" :disabled="isEventPast"
            @click="toggleSave">
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
            <img src="/confetti.svg" alt="Confetti" class="stat-icon-img" />
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
        <button v-if="event.attractions.length > 0" class="tab-btn" :class="{ active: activeTab === 'lineup' }"
          @click="activeTab = 'lineup'">
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

          <!-- FAQs Section (collapsible inside info tab) -->
          <div class="faqs-section-inline">
            <button class="faqs-toggle-btn" :class="{ open: showFaqs }" @click="showFaqs = !showFaqs">
              <div class="faqs-toggle-left">
                <div class="faqs-icon-wrapper-sm">
                  <i class="mdi mdi-help-circle" />
                </div>
                <div class="faqs-toggle-text">
                  <span class="faqs-toggle-title">Perguntas Frequentes</span>
                  <span class="faqs-toggle-sub">Tire suas dúvidas sobre o evento</span>
                </div>
              </div>
              <div class="faqs-chevron" :class="{ rotated: showFaqs }">
                <i class="mdi mdi-chevron-down" />
              </div>
            </button>

            <Transition name="faq-expand">
              <div v-if="showFaqs" class="faqs-content">
                <div class="faqs-list">
                  <div v-for="(faq, index) in faqs" :key="index" class="faq-item"
                    :class="{ open: openFaqIndex === index }" :style="{ animationDelay: `${index * 0.05}s` }">
                    <button class="faq-question" :style="{ background: faq.gradient }" @click="toggleFaq(index)">
                      <div class="faq-q-content">
                        <div class="faq-icon">
                          <i :class="faq.icon" />
                        </div>
                        <span class="faq-q-text">{{ faq.question }}</span>
                      </div>
                      <div class="faq-toggle-icon" :class="{ rotated: openFaqIndex === index }">
                        <i class="mdi mdi-chevron-down" />
                      </div>
                    </button>
                    <Transition name="faq-expand">
                      <div v-if="openFaqIndex === index" class="faq-answer">
                        <div class="faq-answer-content">
                          <i class="mdi mdi-chat-question-outline faq-answer-icon" />
                          <p>{{ faq.answer }}</p>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>

                <div class="faqs-footer">
                  <div class="faqs-footer-content">
                    <i class="mdi mdi-message-text-outline" />
                    <p>Não encontrou sua resposta? <a class="faqs-contact-link" href="#">Entre em contato conosco</a>
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
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
          <div v-for="(attraction, index) in event.attractions" :key="index" class="lineup-card"
            :style="{ animationDelay: `${index * 0.1}s` }">
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
        <button class="cta-button" :class="{ confirmed: isConfirmed, disabled: isEventPast }" :disabled="isEventPast"
          @click="handleConfirmAttendance">
          <i class="mdi" :class="isConfirmed ? 'mdi-check-circle' : 'mdi-party-popper'" />
          <span>{{ isEventPast ? 'EVENTO ENCERRADO' : (isConfirmed ? 'CONFIRMADO!' : 'EU VOU!') }}</span>
        </button>
      </div>

      <!-- Legal Links -->
      <div class="legal-section">
        <button class="legal-link" type="button" @click="openTermsModal('terms')">Termos de uso</button>
        <span class="legal-dot">•</span>
        <button class="legal-link" type="button" @click="openTermsModal('privacy')">Política de privacidade</button>
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

    <!-- Modal de Termos / Política -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTermsModal" class="terms-modal-overlay" @click.self="showTermsModal = false">
          <div class="terms-modal">
            <div class="terms-modal-header">
              <h3 class="terms-modal-title">
                {{ termsModalPdf === 'terms' ? 'Termos de Uso' : 'Política de Privacidade' }}
              </h3>
              <button class="terms-modal-close" type="button" @click="showTermsModal = false">
                <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2" viewBox="0 0 24 24" width="18">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="terms-modal-body">
              <iframe class="terms-pdf-viewer"
                :src="termsModalPdf === 'terms' ? '/termos-de-uso.pdf' : '/politica-de-privacidade.pdf'"
                title="Documento legal" />
            </div>
            <div class="terms-modal-footer">
              <button class="terms-close-btn" type="button" @click="showTermsModal = false">
                Fechar
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
  overflow-x: hidden;
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
  animation: confettiBurst 0.6s ease;
}

.fab-btn img {
    width: 20px;
    height: 20px;
    filter: brightness(0) saturate(100%) invert(20%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(95%) contrast(95%);
  }

  .fab-btn.like-btn.active img {
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  animation: confettiBurst 0.6s ease;
}

.fab-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%);
}

.fab-btn.like-btn.active .fab-icon {
  filter: brightness(0) saturate(100%) invert(100%);
  animation: confettiBurst 0.6s ease;
}

.fab-btn.save-btn.active {
  background: linear-gradient(135deg, #ffba4b 0%, #ffa502 100%);
  color: white;
}

.fab-btn.disabled,
.fab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.fab-btn.disabled:hover,
.fab-btn:disabled:hover {
  transform: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
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

@keyframes confettiBurst {
  0% {
    transform: scale(1) rotate(0deg);
  }

  25% {
    transform: scale(1.3) rotate(-10deg);
  }

  50% {
    transform: scale(1.4) rotate(10deg);
  }

  75% {
    transform: scale(1.2) rotate(-5deg);
  }

  100% {
    transform: scale(1) rotate(0deg);
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
  flex-wrap: wrap;
  gap: 0.5rem;
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

.stat-icon svg {
  color: inherit;
}

.stat-icon.confirmed {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%);
  color: #4CAF50;
}

.stat-icon.share {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(100, 181, 246, 0.15) 100%);
  color: #2196F3;
}

.stat-icon-img {
  width: 24px;
  height: 24px;
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
  white-space: pre-wrap;
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

.cta-button.disabled,
.cta-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  background: linear-gradient(135deg, #999 0%, #777 100%);
  box-shadow: none;
}

.cta-button.disabled:hover,
.cta-button:disabled:hover {
  transform: none;
  box-shadow: none;
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

.legal-link {
  background: none;
  border: none;
  color: #888;
  font-size: 0.8rem;
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.legal-link:hover {
  color: #ff5fa6;
}

.legal-dot {
  color: #ccc;
}

/* FAQs Section - Inline in info tab */
.faqs-section-inline {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  background: #fafafa;
  transition: all 0.3s ease;
}

.faqs-section-inline:hover {
  border-color: rgba(255, 95, 166, 0.2);
}

.faqs-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;
}

.faqs-toggle-btn:hover {
  background: rgba(255, 95, 166, 0.04);
}

.faqs-toggle-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.faqs-icon-wrapper-sm {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.25);
}

.faqs-toggle-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.faqs-toggle-title {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  background: linear-gradient(135deg, #ff5fa6, #ffba4b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.faqs-toggle-sub {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.1rem;
}

.faqs-chevron {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 95, 166, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #ff5fa6;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.faqs-chevron.rotated {
  transform: rotate(180deg);
  background: rgba(255, 95, 166, 0.2);
}

.faqs-content {
  border-top: 1px solid rgba(255, 95, 166, 0.1);
  padding: 1.25rem;
}

/* FAQs Section */
.faqs-section {
  padding: 3rem 1.5rem;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  position: relative;
}

.faqs-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(90deg, #ff5fa6, #ffba4b);
  border-image-slice: 1;
}

.faqs-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  box-shadow: 0 8px 25px rgba(255, 95, 166, 0.3);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.faqs-title-block {
  flex: 1;
}

.faqs-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.25rem;
  background: linear-gradient(135deg, #ff5fa6, #ffba4b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.faqs-subtitle {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

.faqs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.faq-item {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.faq-item:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.faq-item.open {
  box-shadow: 0 10px 35px rgba(255, 95, 166, 0.15);
}

.faq-question {
  width: 100%;
  padding: 1.25rem 1.5rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.faq-question::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.faq-question:hover::before {
  opacity: 1;
}

.faq-q-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  text-align: left;
}

.faq-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.faq-q-text {
  line-height: 1.4;
}

.faq-toggle-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.faq-toggle-icon.rotated {
  transform: rotate(180deg);
  background: rgba(255, 255, 255, 0.35);
}

.faq-answer {
  background: white;
  overflow: hidden;
}

.faq-answer-content {
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.faq-answer-icon {
  font-size: 1.5rem;
  color: #ff5fa6;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.faq-answer-content p {
  margin: 0;
  color: #555;
  line-height: 1.7;
  font-size: 0.95rem;
}

.faqs-footer {
  padding: 1.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%);
  border: 2px dashed rgba(255, 95, 166, 0.2);
}

.faqs-footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #666;
  font-size: 0.95rem;
}

.faqs-footer-content i {
  font-size: 1.5rem;
  color: #ff5fa6;
}

.faqs-contact-link {
  color: #ff5fa6;
  font-weight: 600;
  text-decoration: none;
  position: relative;
  transition: color 0.2s;
}

.faqs-contact-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #ff5fa6, #ffba4b);
  transition: width 0.3s ease;
}

.faqs-contact-link:hover {
  color: #ffba4b;
}

.faqs-contact-link:hover::after {
  width: 100%;
}

/* FAQ Expand Transition */
.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: all 0.3s ease;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.faq-expand-enter-to,
.faq-expand-leave-from {
  max-height: 500px;
  opacity: 1;
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

  .faqs-section {
    padding: 2rem 1rem;
  }

  .faqs-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .faqs-title {
    font-size: 1.5rem;
  }

  .faq-question {
    padding: 1rem;
    font-size: 0.9rem;
  }

  .faq-icon {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  .faq-answer-content {
    padding: 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }

  .faqs-footer-content {
    flex-direction: column;
    text-align: center;
    font-size: 0.85rem;
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

  .faqs-icon-wrapper {
    width: 50px;
    height: 50px;
    font-size: 1.6rem;
  }

  .faq-q-text {
    font-size: 0.85rem;
  }

  .faq-toggle-icon {
    width: 32px;
    height: 32px;
    font-size: 1.3rem;
  }

  .faqs-toggle-btn {
    padding: 1rem;
  }

  .faqs-icon-wrapper-sm {
    width: 38px;
    height: 38px;
    font-size: 1.2rem;
  }

  .faqs-toggle-title {
    font-size: 0.9rem;
  }

  .faqs-toggle-sub {
    font-size: 0.72rem;
  }

  .faqs-chevron {
    width: 32px;
    height: 32px;
    font-size: 1.2rem;
  }

  .faqs-content {
    padding: 0.85rem;
  }
}

@media (max-width: 360px) {
  .hero-section {
    height: 240px;
  }

  .hero-title {
    font-size: 1.2rem;
  }

  .hero-content {
    bottom: 14px;
    left: 12px;
    right: 12px;
  }

  .countdown-grid {
    flex-wrap: wrap;
    justify-content: center;
  }

  .countdown-item {
    min-width: 40px;
    padding: 0.35rem 0.4rem;
  }

  .countdown-value {
    font-size: 1rem;
  }

  .countdown-separator {
    font-size: 1rem;
  }

  .stat-icon {
    width: 30px;
    height: 30px;
    font-size: 0.85rem;
  }

  .stat-value {
    font-size: 0.95rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .stat-divider {
    height: 28px;
  }

  .organizer-avatar {
    width: 40px;
    height: 40px;
  }

  .follow-btn {
    padding: 0.45rem 0.9rem;
    font-size: 0.78rem;
  }

  .tab-btn {
    padding: 0.6rem 0.9rem;
    font-size: 0.8rem;
  }

  .cta-button {
    padding: 0.85rem 1.25rem;
    font-size: 0.95rem;
  }

  .location-icon-wrapper {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }

  .location-address {
    font-size: 0.9rem;
  }

  .faq-question {
    padding: 0.85rem;
    font-size: 0.82rem;
  }

  .faq-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .modal-content {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .modal-icon {
    width: 64px;
    height: 64px;
    font-size: 2rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .modal-actions {
    flex-direction: column;
  }
}

/* ---- Modal de Termos ---- */
.terms-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.terms-modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.terms-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.terms-modal-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.terms-modal-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terms-modal-close:hover {
  background: #fee2e2;
  color: #ef4444;
}

.terms-modal-body {
  flex: 1;
  overflow: hidden;
}

.terms-pdf-viewer {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border: none;
}

.terms-modal-footer {
  display: flex;
  gap: 10px;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  justify-content: flex-end;
}

.terms-close-btn {
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #F978A3 0%, #f97316 100%);
  color: #fff;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(249, 120, 163, 0.3);
}

.terms-close-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(249, 120, 163, 0.4);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
