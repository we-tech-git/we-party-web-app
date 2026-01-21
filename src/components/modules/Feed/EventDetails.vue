<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
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
  const infoExpanded = ref(true)
  const errorMessage = ref('')

  function mapEventPayload (data: any): EventDetail {
    return {
      id: data?.id,
      title: data?.name || data?.title || 'Evento sem título',
      date: data?.date
        ? new Date(data.date).toLocaleString()
        : data?.schedule || 'Data não informada',
      location: data?.location || data?.address || data?.place || 'Local não informado',
      image: resolveAsset(data?.bannerUrl || data?.banner || data?.photos?.[0]),
      description: data?.description || 'Sem descrição disponível.',
      attractions: data?.attractions || data?.lineup || [],
      contactInfo: data?.contactInfo || 'Informações de contato não disponíveis.',
      categories: data?.categories || data?.tags || (data?.eventInterests || []).map((i: any) => i.interest?.name).filter(Boolean) || [],
      confirmedCount: data?.confirmedCount || data?.confirmed || 0,
      likes: data?.likes || data?._count?.likes || 0,
      organizer: {
        name: data?.organizer?.name || data?.hostName || data?.creator?.name || 'Unknown',
        avatar: data?.organizer?.avatar || data?.hostAvatar || data?.creator?.profileImage || '',
      },
    }
  }

  const isLiked = computed(() => eventsStore.isLiked(event.value.id))
  const isSaved = computed(() => eventsStore.isSaved(event.value.id))
  const displayLikes = computed(() => {
    return (event.value.likes || 0) + (isLiked.value ? 1 : 0)
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

  async function fetchEventDetails (id: string | number) {
    loading.value = true
    errorMessage.value = ''
    try {
      const response = await getEventById(id)
      const payload = response?.data?.event || response?.data || response
      event.value = mapEventPayload(payload)
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
    <!-- Header Image -->
    <div class="image-wrapper">
      <img alt="Banner do Evento" class="event-image" :src="event.image">
      <div class="image-overlay" />

      <div class="image-actions">
        <button
          class="action-badge"
          style="border: none; cursor: pointer; color: white; background: rgba(0,0,0,0.5);"
          @click="toggleLike"
        >
          <i
            class="mdi"
            :class="isLiked ? 'mdi-heart' : 'mdi-heart-outline'"
            :style="{ color: isLiked ? '#ff4757' : 'inherit' }"
          />
          {{ displayLikes }}
        </button>

        <div class="spacer" />

        <button
          class="action-badge"
          style="border: none; cursor: pointer; color: white; background: rgba(0,0,0,0.5);"
          @click="toggleSave"
        >
          <i
            class="mdi"
            :class="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
            :style="{ color: isSaved ? '#ffa502' : 'inherit' }"
          />
        </button>
        <button
          class="action-badge"
          style="border: none; cursor: pointer; color: white; background: rgba(0,0,0,0.5);"
          @click="handleShare"
        >
          <i class="mdi mdi-share-variant" />
        </button>
      </div>
    </div>

    <div class="content-body">
      <div v-if="loading" class="state-message">Carregando evento...</div>
      <div v-else-if="errorMessage" class="state-message error">{{ errorMessage }}</div>
      <div v-else class="content-wrapper">
        <!-- Title Section -->
        <div class="header-section">
          <h1 class="event-title">{{ event.title }}</h1>

          <div class="meta-info">
            <div class="meta-item">
              <i class="mdi mdi-calendar-clock text-purple-500" />
              <span>{{ event.date }}</span>
            </div>
            <div class="meta-item">
              <i class="mdi mdi-map-marker text-purple-500" />
              <span>{{ event.location }}</span>
            </div>
          </div>
        </div>

        <!-- Accordion Info -->
        <div class="accordion-wrapper">
          <button class="accordion-header" @click="infoExpanded = !infoExpanded">
            <span class="font-bold text-gray-800">Informações do Evento</span>
            <i class="mdi mdi-chevron-down transition-transform duration-300" :class="{ 'rotate-180': infoExpanded }" />
          </button>

          <div class="accordion-content" :class="{ 'expanded': infoExpanded }">
            <div class="inner-content">
              <h3 class="subsection-title">Descrição do evento</h3>
              <p class="description-text">{{ event.description }}</p>

              <div class="lineup-list">
                <div v-for="(attraction, index) in event.attractions" :key="index" class="lineup-item">
                  <i class="mdi mdi-star-four-points text-orange-400 text-xs" />
                  <span>{{ attraction }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Doubts -->
        <div class="section-block">
          <h3 class="section-title">Dúvidas relacionadas ao evento:</h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            {{ event.contactInfo }}
          </p>
        </div>

        <!-- Location -->
        <div class="section-block">
          <h3 class="section-title">Local e Data</h3>
          <div class="location-card">
            <div class="loc-details">
              <div class="loc-row">
                <i class="mdi mdi-calendar text-purple-600" />
                <span>{{ event.date }}</span>
              </div>
              <div class="loc-row">
                <i class="mdi mdi-map-marker text-purple-600" />
                <span>{{ event.location }}</span>
              </div>
            </div>
            <button class="map-btn" @click="openMap">
              <i class="mdi mdi-map-legend mr-1" /> VER NO MAPA
            </button>
          </div>
        </div>

        <!-- Categories -->
        <div class="section-block">
          <h3 class="section-title">Categorias do evento</h3>
          <div class="categories-wrapper">
            <span v-for="cat in event.categories" :key="cat" class="category-chip">
              {{ cat }}
            </span>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-section">
          <div class="legal-links">
            <a href="#">Termos de uso</a>
            <a href="#">Política e privacidade</a>
          </div>

          <button class="cta-button">
            EU VOU!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-details-container {
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  width: 90%;
  margin: 0 auto;
  font-family: 'Poppins', sans-serif;
}

/* Image Header */
.image-wrapper {
  position: relative;
  height: 320px;
  width: 100%;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
}

.image-actions {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  gap: 12px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
}

.action-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 8px;
}

.spacer {
  flex: 1;
}

/* Content Body */
.content-body {
  padding: 24px;
}

.state-message {
  padding: 1rem 0;
  font-weight: 600;
  color: #4a4a4a;
}

.state-message.error {
  color: #c62828;
}

.header-section {
  margin-bottom: 24px;
}

.event-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #4A148C;
  /* Deep Purple */
  line-height: 1.2;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Accordion */
.accordion-wrapper {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
  background: #F3E5F5;
  /* Light Purple bg for header */
}

.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #E1BEE7;
  /* Slightly darker purple */
  color: #4A148C;
  cursor: pointer;
  border: none;
  outline: none;
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease-out;
  background: #fff;
}

.accordion-content.expanded {
  max-height: 1000px;
  /* Arbitrary large height */
}

.inner-content {
  padding: 16px;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 700;
  color: #4A148C;
  margin-bottom: 8px;
}

.description-text {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 16px;
}

.lineup-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.lineup-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #333;
}

/* Sections */
.section-block {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #4A148C;
  margin-bottom: 12px;
}

/* Location Card */
.location-card {
  background: #FAFAFA;
  border: 1px solid #EEE;
  border-radius: 12px;
  padding: 16px;
}

.loc-details {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #555;
}

.map-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid #E1BEE7;
  border-radius: 8px;
  background: #fff;
  color: #4A148C;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-btn:hover {
  background: #F3E5F5;
}

/* Categories */
.categories-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-chip {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(255, 95, 166, 0.32);
}

/* Footer */
.footer-section {
  margin-top: 32px;
  text-align: center;
}

.legal-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.legal-links a {
  color: #039BE5;
  font-size: 0.85rem;
  text-decoration: none;
  font-weight: 600;
}

.cta-button {
  width: 100%;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-size: 1.2rem;
  font-weight: 800;
  padding: 16px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 18px 34px rgba(255, 95, 166, 0.32);
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(244, 143, 177, 0.5);
}

.cta-button:active {
  transform: translateY(0);
}
</style>
