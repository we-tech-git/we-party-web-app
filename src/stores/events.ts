import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getFavoriteEvents,
  getLikedEvents,
  toggleAttendance,
  toggleFavoriteEvent,
  toggleLikeEvent,
} from '@/api/event'

export type EventId = string | number

export interface ImageOption {
  url: string
  ratio: string
  width: number
  height: number
}

export interface FeedItem {
  id: EventId
  banner: string
  creator: {
    name: string
  }
  hostAvatar: string
  schedule: string
  location?: string
  title: string
  description: string
  confirmed: number
  interested: number
  likes?: number
  interests?: string[]
  matchedInterests?: string[]
  commentsCount?: number
  sourceUrl?: string
  images?: ImageOption[]
}

function sanitizeSavedEvents (items: FeedItem[]) {
  const filtered = items.filter(
    item => item && item.id !== undefined && item.id !== null,
  )
  const seen = new Set<string>()
  return filtered.filter(item => {
    const key = String(item.id)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export const useEventsStore = defineStore('events', () => {
  // Estado em memória - sem localStorage
  const savedEvents = ref<FeedItem[]>([])
  const likedEvents = ref<EventId[]>([])
  const confirmedEvents = ref<EventId[]>([])

  // Flags para controlar se os dados já foram carregados da API
  const isInitialized = ref({
    favorites: false,
    liked: false,
    confirmed: false,
  })

  async function toggleSave (event: FeedItem) {
    const index = savedEvents.value.findIndex(e => e.id === event.id)
    const isAdding = index === -1

    // Atualização otimista na UI
    if (isAdding) {
      savedEvents.value.push(event)
    } else {
      savedEvents.value.splice(index, 1)
    }

    try {
      // Chama a API para favoritar/desfavoritar
      await toggleFavoriteEvent(event.id)
    } catch (error) {
      console.error('Erro ao favoritar evento no servidor:', error)
      // Reverte a alteração em caso de erro
      if (isAdding) {
        const revertIndex = savedEvents.value.findIndex(
          e => e.id === event.id,
        )
        if (revertIndex !== -1) {
          savedEvents.value.splice(revertIndex, 1)
        }
      } else {
        savedEvents.value.push(event)
      }
    }
  }

  function isSaved (id: EventId) {
    const normalizedId = String(id)
    return savedEvents.value.some(e => String(e.id) === normalizedId)
  }

  async function toggleLike (id: EventId) {
    const normalizedId = String(id)
    // Optimistic update
    const index = likedEvents.value.findIndex(
      likedId => String(likedId) === normalizedId,
    )
    const isAdding = index === -1

    if (isAdding) {
      likedEvents.value.push(normalizedId)
    } else {
      likedEvents.value.splice(index, 1)
    }

    try {
      await toggleLikeEvent(id)
    } catch (error) {
      // Revert if API fails
      console.error('Failed to toggle like on server', error)
      const revertIndex = likedEvents.value.findIndex(
        likedId => String(likedId) === normalizedId,
      )
      if (isAdding && revertIndex !== -1) {
        likedEvents.value.splice(revertIndex, 1)
      } else if (!isAdding && revertIndex === -1) {
        likedEvents.value.push(normalizedId)
      }
    }
  }

  function isLiked (id: EventId) {
    const normalizedId = String(id)
    return likedEvents.value.some(
      likedId => String(likedId) === normalizedId,
    )
  }

  async function toggleConfirm (id: EventId) {
    const normalizedId = String(id)
    const index = confirmedEvents.value.findIndex(
      cId => String(cId) === normalizedId,
    )
    const isAdding = index === -1

    // Optimistic update
    if (isAdding) {
      confirmedEvents.value.push(normalizedId)
    } else {
      confirmedEvents.value.splice(index, 1)
    }

    try {
      await toggleAttendance(id)
    } catch (error) {
      console.error('Failed to toggle attendance on server', error)
      // Revert if API fails
      const revertIndex = confirmedEvents.value.findIndex(
        cId => String(cId) === normalizedId,
      )
      if (isAdding && revertIndex !== -1) {
        confirmedEvents.value.splice(revertIndex, 1)
      } else if (!isAdding && revertIndex === -1) {
        confirmedEvents.value.push(normalizedId)
      }
    }
  }

  function isConfirmed (id: EventId) {
    const normalizedId = String(id)
    return confirmedEvents.value.some(cId => String(cId) === normalizedId)
  }

  /**
   * Sincroniza os favoritos com o servidor
   * Deve ser chamado no onMounted dos componentes que precisam dessa informação
   */
  async function syncFavoritesWithServer () {
    try {
      const response = await getFavoriteEvents(1, 100)
      const data = response.data

      // Tenta extrair eventos de diferentes estruturas de resposta
      let events: any[] = []
      if (data?.data?.events) {
        events = data.data.events
      } else if (data?.events) {
        events = data.events
      } else if (Array.isArray(data?.data)) {
        events = data.data
      } else if (Array.isArray(data)) {
        events = data
      }

      // Mapeia os eventos da API para o formato FeedItem
      const mappedEvents: FeedItem[] = events.map((evt: any) => ({
        id: evt.id,
        banner: evt.bannerUrl || evt.banner || '',
        creator: {
          name:
            evt.organizer?.name
            || evt.hostName
            || evt.creator?.name
            || 'Organizador',
        },
        hostAvatar:
          evt.organizer?.avatar
          || evt.hostAvatar
          || evt.creator?.profileImage
          || '',
        schedule: '',
        location: evt.location || evt.address || '',
        title: evt.name || evt.title || '',
        description: evt.description || '',
        confirmed: evt.confirmedCount || evt._count?.attendances || 0,
        interested: evt.interestedCount || 0,
        likes: evt.likesCount || evt.likes || 0,
        interests: [],
        commentsCount: evt.commentsCount ?? evt._count?.comments ?? 0,
      }))

      savedEvents.value = sanitizeSavedEvents(mappedEvents)
      isInitialized.value.favorites = true
    } catch (error) {
      console.error('Erro ao sincronizar favoritos com servidor:', error)
    }
  }

  /**
   * Sincroniza os eventos curtidos com o servidor
   * NOTA: Este método é opcional e falha silenciosamente se o endpoint não existir
   * O estado de likes normalmente vem dos eventos quando são carregados
   */
  async function syncLikedEventsWithServer () {
    try {
      const response = await getLikedEvents(1, 100)
      const data = response.data

      // Tenta extrair eventos de diferentes estruturas de resposta
      let events: any[] = []
      if (data?.data?.events) {
        events = data.data.events
      } else if (data?.events) {
        events = data.events
      } else if (Array.isArray(data?.data)) {
        events = data.data
      } else if (Array.isArray(data)) {
        events = data
      }

      // Extrai apenas os IDs dos eventos curtidos
      likedEvents.value = events.map((evt: any) => String(evt.id))
      isInitialized.value.liked = true
    } catch (error: any) {
      // Falha silenciosamente se o endpoint não existir (404)
      if (error?.status === 404 || error?.response?.status === 404) {
        console.warn('Endpoint de eventos curtidos não disponível (404). Usando apenas optimistic updates.')
      } else {
        console.error('Erro ao sincronizar eventos curtidos com servidor:', error)
      }
    }
  }

  /**
   * Limpa todos os estados do store
   * Deve ser chamado no logout
   */
  function clearAll () {
    savedEvents.value = []
    likedEvents.value = []
    confirmedEvents.value = []
    isInitialized.value = {
      favorites: false,
      liked: false,
      confirmed: false,
    }
  }

  return {
    savedEvents,
    toggleSave,
    isSaved,
    likedEvents,
    toggleLike,
    isLiked,
    confirmedEvents,
    toggleConfirm,
    isConfirmed,
    syncFavoritesWithServer,
    syncLikedEventsWithServer,
    clearAll,
    isInitialized,
  }
})
