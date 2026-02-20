import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getFavoriteEvents, toggleFavoriteEvent, toggleLikeEvent } from '@/api/event'
import { AuthService } from '@/services/auth'

export type EventId = string | number

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
}

const SAVED_EVENTS_KEY = 'SAVED_EVENTS'
const LIKED_EVENTS_KEY = 'LIKED_EVENTS'

function getScopedKey (baseKey: string) {
  const user = AuthService.getUser()
  return user?.id ? `${baseKey}_${user.id}` : baseKey
}

function sanitizeSavedEvents (items: FeedItem[]) {
  const filtered = items.filter(item => item && item.id !== undefined && item.id !== null)
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
  const savedEvents = ref<FeedItem[]>([])
  const likedEvents = ref<EventId[]>([])

  // Load from local storage on init
  const stored = localStorage.getItem(getScopedKey(SAVED_EVENTS_KEY))
  if (stored) {
    try {
      savedEvents.value = sanitizeSavedEvents(JSON.parse(stored))
    } catch (error) {
      console.error('Failed to parse saved events', error)
    }
  }

  const likedStored = localStorage.getItem(getScopedKey(LIKED_EVENTS_KEY))
  if (likedStored) {
    try {
      likedEvents.value = JSON.parse(likedStored)
    } catch (error) {
      console.error('Failed to parse liked events', error)
    }
  }

  async function toggleSave (event: FeedItem) {
    const index = savedEvents.value.findIndex(e => e.id === event.id)
    const isAdding = index === -1

    // Atualização otimista na UI
    if (isAdding) {
      savedEvents.value.push(event)
    } else {
      savedEvents.value.splice(index, 1)
    }
    localStorage.setItem(getScopedKey(SAVED_EVENTS_KEY), JSON.stringify(savedEvents.value))

    try {
      // Chama a API para favoritar/desfavoritar
      await toggleFavoriteEvent(event.id)
    } catch (error) {
      console.error('Erro ao favoritar evento no servidor:', error)
      // Reverte a alteração em caso de erro
      if (isAdding) {
        const revertIndex = savedEvents.value.findIndex(e => e.id === event.id)
        if (revertIndex !== -1) {
          savedEvents.value.splice(revertIndex, 1)
        }
      } else {
        savedEvents.value.push(event)
      }
      localStorage.setItem(getScopedKey(SAVED_EVENTS_KEY), JSON.stringify(savedEvents.value))
    }
  }

  function isSaved (id: EventId) {
    const normalizedId = String(id)
    return savedEvents.value.some(e => String(e.id) === normalizedId)
  }

  async function toggleLike (id: EventId) {
    const normalizedId = String(id)
    // Optimistic update
    const index = likedEvents.value.findIndex(likedId => String(likedId) === normalizedId)
    const isAdding = index === -1

    if (isAdding) {
      likedEvents.value.push(normalizedId)
    } else {
      likedEvents.value.splice(index, 1)
    }
    localStorage.setItem(getScopedKey(LIKED_EVENTS_KEY), JSON.stringify(likedEvents.value))

    try {
      await toggleLikeEvent(id)
    } catch (error) {
      // Revert if API fails
      console.error('Failed to toggle like on server', error)
      const revertIndex = likedEvents.value.findIndex(likedId => String(likedId) === normalizedId)
      if (isAdding && revertIndex !== -1) {
        likedEvents.value.splice(revertIndex, 1)
      } else if (!isAdding && revertIndex === -1) {
        likedEvents.value.push(normalizedId)
      }
      localStorage.setItem(getScopedKey(LIKED_EVENTS_KEY), JSON.stringify(likedEvents.value))
    }
  }

  function isLiked (id: EventId) {
    const normalizedId = String(id)
    return likedEvents.value.some(likedId => String(likedId) === normalizedId)
  }

  /**
   * Sincroniza os favoritos do localStorage com o servidor
   * Útil para garantir que o cliente tenha os dados mais atualizados
   */
  async function syncFavoritesWithServer () {
    try {
      const response = await getFavoriteEvents(1, 100) // Busca até 100 favoritos
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

      // Atualiza o localStorage com os favoritos do servidor
      savedEvents.value = events as FeedItem[]
      localStorage.setItem(getScopedKey(SAVED_EVENTS_KEY), JSON.stringify(savedEvents.value))

      console.log('✅ Favoritos sincronizados com servidor:', savedEvents.value.length, 'eventos')
    } catch (error) {
      console.error('❌ Erro ao sincronizar favoritos com servidor:', error)
    }
  }

  return {
    savedEvents,
    toggleSave,
    isSaved,
    likedEvents,
    toggleLike,
    isLiked,
    syncFavoritesWithServer,
  }
})
