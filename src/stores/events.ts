import { defineStore } from 'pinia'
import { ref } from 'vue'
import { unwrapList } from '@/api'
import {
  cancelAttendance,
  confirmAttendance,
  getFavoriteEvents,
  getLikedEvents,
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

/**
 * Resolve a data/horário de exibição do evento a partir dos possíveis
 * campos retornados pela API. Mesma lógica usada em Feed.vue (P19: o
 * mapeador de favoritos não calculava esse campo, ficava sempre vazio).
 */
function resolveSchedule (event: any): string {
  const candidates = [
    event.date,
    event.startDate,
    event.dateTime,
    event.startAt,
    event.eventDate,
    event.start_date,
    event.schedule,
  ]
  for (const val of candidates) {
    if (!val) continue
    const parsed = new Date(val)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    }
  }
  return 'Data a definir'
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
  // Contagem canônica de curtidas por evento, compartilhada entre feed/detalhes
  // para evitar que cada tela some "+1 se curtido" sobre um valor que a API
  // de origem pode ou não já incluir a curtida do próprio usuário.
  const likeCounts = ref<Record<string, number>>({})

  // Limpa localStorage legado (se houver)
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('weparty_confirmed_events')
  }

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

    // Ajusta a contagem canônica na mesma direção do toggle
    const currentCount = likeCounts.value[normalizedId] ?? 0
    likeCounts.value[normalizedId] = Math.max(0, currentCount + (isAdding ? 1 : -1))

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

      const revertedCount = likeCounts.value[normalizedId] ?? 0
      likeCounts.value[normalizedId] = Math.max(0, revertedCount + (isAdding ? -1 : 1))
    }
  }

  function isLiked (id: EventId) {
    const normalizedId = String(id)
    return likedEvents.value.some(
      likedId => String(likedId) === normalizedId,
    )
  }

  /**
   * Registra a contagem "base" de curtidas vinda da API para um evento,
   * apenas se ainda não houver uma contagem conhecida. Isso garante uma
   * única fonte de verdade compartilhada entre feed e telas de detalhe,
   * em vez de cada tela recalcular "+1 se curtido" sobre o próprio valor.
   */
  function registerLikeCount (id: EventId, count: number) {
    const normalizedId = String(id)
    if (likeCounts.value[normalizedId] === undefined) {
      likeCounts.value[normalizedId] = count
    }
  }

  function getLikeCount (id: EventId, fallback = 0) {
    const normalizedId = String(id)
    return likeCounts.value[normalizedId] ?? fallback
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
      // PUT para confirmar, DELETE para cancelar
      await (isAdding ? confirmAttendance(id) : cancelAttendance(id))
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

  function setConfirmed (id: EventId, isConfirmed: boolean) {
    const normalizedId = String(id)
    const index = confirmedEvents.value.findIndex(
      cId => String(cId) === normalizedId,
    )

    if (isConfirmed && index === -1) {
      confirmedEvents.value.push(normalizedId)
    } else if (!isConfirmed && index !== -1) {
      confirmedEvents.value.splice(index, 1)
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

      // Extrai eventos da resposta (unwrapList aceita os envelopes conhecidos)
      const events = unwrapList<any>(response, 'events')

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
        schedule: resolveSchedule(evt),
        location: evt.location || evt.address || '',
        title: evt.name || evt.title || '',
        description: evt.description || '',
        confirmed: evt.confirmedCount || evt._count?.attendances || 0,
        interested: evt.interestedCount || 0,
        likes: evt.likesCount || evt.likes || 0,
        interests: (evt.eventInterests || evt.interests || evt.categories || evt.tags || [])
          .map((i: any) => typeof i === 'string' ? i : i.interest?.name || i.name)
          .filter(Boolean),
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

      // Extrai eventos da resposta (unwrapList aceita os envelopes conhecidos)
      const events = unwrapList<any>(response, 'events')

      // Mescla em vez de substituir: essa chamada não é aguardada por quem a
      // invoca, então o usuário pode clicar em curtir (optimistic update)
      // enquanto o GET ainda está em voo. Sobrescrever likedEvents.value
      // diretamente derrubava esse clique assim que a resposta (mais antiga
      // que o clique) chegasse — a curtida sumia da tela mesmo tendo sido
      // enviada ao servidor.
      const serverLikedIds = events.map((evt: any) => String(evt.id))
      const merged = new Set([...likedEvents.value.map(String), ...serverLikedIds])
      likedEvents.value = [...merged]
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
    likeCounts.value = {}
    // Limpa localStorage legado se existir
    localStorage.removeItem('weparty_confirmed_events')
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
    likeCounts,
    registerLikeCount,
    getLikeCount,
    confirmedEvents,
    toggleConfirm,
    setConfirmed,
    isConfirmed,
    syncFavoritesWithServer,
    syncLikedEventsWithServer,
    clearAll,
    isInitialized,
  }
})
