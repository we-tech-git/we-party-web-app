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
    if (!val) {
      continue
    }
    const parsed = new Date(val)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    }
  }
  return 'Data a definir'
}

/**
 * Lê a contagem de curtidas de um payload cru de evento.
 *
 * Devolve `undefined` — e não `0` — quando nenhum campo reconhecível existe.
 * A diferença importa: `0` afirma "este evento tem zero curtidas" e deve
 * sobrescrever o valor conhecido; a *ausência* do campo não afirma nada.
 * Tratar os dois casos como iguais era o que zerava a contagem correta que o
 * feed já havia trazido, deixando o coração aceso com o número errado.
 */
export function readLikeCount (raw: any): number | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }

  const aliases = [
    raw.likesCount,
    raw.likes_count,
    raw.totalLikes,
    raw.likeCount,
    raw._count?.likes,
  ]
  for (const value of aliases) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, value)
    }
  }

  // `likes` é ambíguo entre endpoints: número em uns, array de usuários em outros.
  if (typeof raw.likes === 'number' && Number.isFinite(raw.likes)) {
    return Math.max(0, raw.likes)
  }
  if (Array.isArray(raw.likes)) {
    return raw.likes.length
  }

  return undefined
}

/**
 * Lê se o usuário logado curtiu, aceitando os apelidos usados pelos diferentes
 * endpoints. `undefined` significa "este endpoint não informa", caso em que o
 * estado já conhecido é preservado em vez de virar `false`.
 *
 * Nunca conte presenças aqui: `confirmedCount`/`attendances` são outra coisa.
 */
export function readLikedFlag (raw: any): boolean | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }

  const aliases = [raw.isLiked, raw.liked, raw.isLikedByMe, raw.likedByMe, raw.hasLiked]
  for (const value of aliases) {
    if (typeof value === 'boolean') {
      return value
    }
  }
  return undefined
}

/** Desembrulha `{ data: { data: X } }`, `{ data: X }` ou `X`. */
function unwrapPayload (response: any): any {
  return response?.data?.data ?? response?.data ?? response
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

/** Tamanho de página e teto de varredura usados por `syncLikedEventsWithServer`. */
const LIKED_SYNC_PAGE_SIZE = 100
const LIKED_SYNC_MAX_PAGES = 20

export const useEventsStore = defineStore('events', () => {
  // Estado em memória - sem localStorage
  const savedEvents = ref<FeedItem[]>([])
  const likedEvents = ref<EventId[]>([])
  const confirmedEvents = ref<EventId[]>([])
  // Contagem canônica de curtidas por evento, compartilhada entre feed/detalhes
  // para evitar que cada tela some "+1 se curtido" sobre um valor que a API
  // de origem pode ou não já incluir a curtida do próprio usuário.
  const likeCounts = ref<Record<string, number>>({})
  // Ids com um POST de curtida em voo. Uma resposta de listagem disparada
  // ANTES do clique não pode desfazer o clique ao chegar depois dele — era
  // isso que fazia a curtida recém-dada sumir sozinha da tela.
  const pendingLikes = ref(new Set<string>())

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

  function applyLiked (key: string, liked: boolean) {
    const index = likedEvents.value.findIndex(likedId => String(likedId) === key)
    if (liked && index === -1) {
      likedEvents.value.push(key)
    } else if (!liked && index !== -1) {
      likedEvents.value.splice(index, 1)
    }
  }

  /**
   * Grava o que o servidor disse sobre um evento. Campos `undefined` preservam
   * o valor atual, e nada é gravado enquanto houver um toggle em voo para
   * aquele id — a resposta em voo é mais recente do que qualquer listagem.
   */
  function applyLikeState (id: EventId, count?: number, liked?: boolean) {
    const key = String(id)
    if (pendingLikes.value.has(key)) {
      return
    }
    if (count !== undefined) {
      likeCounts.value[key] = Math.max(0, count)
    }
    if (liked !== undefined) {
      applyLiked(key, liked)
    }
  }

  /**
   * Registra contagem **e** estado de curtida a partir de um payload cru de
   * evento (item do feed, detalhe, favorito…).
   *
   * É o caminho preferido: o estado chega junto do próprio evento, sem depender
   * do endpoint separado `/events/likes`. Quando o backend não manda o campo,
   * `readLikedFlag` devolve `undefined` e o fallback daquele endpoint continua
   * valendo — nada regride.
   */
  function registerEventLikeState (raw: any) {
    const id = raw?.id
    if (id === undefined || id === null) {
      return
    }
    applyLikeState(id, readLikeCount(raw), readLikedFlag(raw))
  }

  async function toggleLike (id: EventId) {
    const key = String(id)
    // O endpoint é um toggle: dois POSTs seguidos no mesmo evento se anulam.
    // Ignorar o clique enquanto o anterior não respondeu é o que impede um
    // duplo clique (ou a impaciência do usuário) de desfazer a própria curtida.
    if (pendingLikes.value.has(key)) {
      return
    }

    const wasLiked = isLiked(key)
    const previousCount = likeCounts.value[key]

    pendingLikes.value.add(key)

    // Optimistic update
    applyLiked(key, !wasLiked)
    likeCounts.value[key] = Math.max(0, (previousCount ?? 0) + (wasLiked ? -1 : 1))

    try {
      const payload = unwrapPayload(await toggleLikeEvent(id))
      const serverCount = readLikeCount(payload)
      const serverLiked = readLikedFlag(payload)

      // A resposta do toggle é a informação mais recente que existe: ela
      // substitui o palpite otimista em vez de somar por cima dele. Somar era
      // o que produzia o "curti uma vez e contou duas".
      if (serverLiked !== undefined) {
        applyLiked(key, serverLiked)
      }
      if (serverCount !== undefined) {
        likeCounts.value[key] = Math.max(0, serverCount)
      }
    } catch (error) {
      console.error('Falha ao curtir evento no servidor', error)
      // Restaura o estado exato de antes do clique. Desfazer por aritmética
      // (±1) acumulava erro quando duas reversões caíam sobre o mesmo id.
      applyLiked(key, wasLiked)
      if (previousCount === undefined) {
        delete likeCounts.value[key]
      } else {
        likeCounts.value[key] = previousCount
      }
    } finally {
      pendingLikes.value.delete(key)
    }
  }

  function isLiked (id: EventId) {
    const normalizedId = String(id)
    return likedEvents.value.some(
      likedId => String(likedId) === normalizedId,
    )
  }

  /**
   * Registra a contagem de curtidas vinda da API para um evento.
   *
   * Antes isto só gravava quando ainda não havia valor, para evitar que telas
   * diferentes brigassem pelo mesmo número. O efeito colateral era a contagem
   * congelar no primeiro valor da sessão e nunca mais refletir o banco: ir ao
   * detalhe e voltar mostrava o número velho. Agora a resposta mais recente
   * vence, e a proteção contra atropelo fica com `pendingLikes` — que é quem
   * de fato sabe se existe um clique do usuário em voo.
   */
  function registerLikeCount (id: EventId, count: number, liked?: boolean) {
    applyLikeState(id, Number.isFinite(count) ? count : undefined, liked)
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
      const mappedEvents: FeedItem[] = events.map((evt: any) => {
        // Favoritos também carregam contagem/estado de curtida: registrar aqui
        // mantém a mesma fonte de verdade das outras telas.
        registerEventLikeState(evt)
        return ({
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
          likes: readLikeCount(evt) ?? 0,
          interests: (evt.eventInterests || evt.interests || evt.categories || evt.tags || [])
            .map((i: any) => typeof i === 'string' ? i : i.interest?.name || i.name)
            .filter(Boolean),
          commentsCount: evt.commentsCount ?? evt._count?.comments ?? 0,
        })
      })

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
      const serverLiked = new Set<string>()
      let enumeratedEverything = false

      // Varre todas as páginas: parar na primeira significaria tratar como
      // "não curtido" tudo o que ficou de fora, apagando corações sozinho.
      for (let page = 1; page <= LIKED_SYNC_MAX_PAGES; page++) {
        const response = await getLikedEvents(page, LIKED_SYNC_PAGE_SIZE)
        const events = unwrapList<any>(response, 'events')

        for (const evt of events) {
          if (!evt?.id) {
            continue
          }
          const key = String(evt.id)
          serverLiked.add(key)
          // Só grava quando o item traz contagem de verdade. Antes havia um
          // `?? 0` aqui que zerava o número correto já trazido pelo feed.
          const count = readLikeCount(evt)
          if (count !== undefined && !pendingLikes.value.has(key)) {
            likeCounts.value[key] = count
          }
        }

        if (events.length < LIKED_SYNC_PAGE_SIZE) {
          enumeratedEverything = true
          break
        }
      }

      if (enumeratedEverything) {
        // Cliques em voo são mais recentes que esta resposta e sobrevivem a ela.
        for (const key of pendingLikes.value) {
          if (isLiked(key)) {
            serverLiked.add(key)
          } else {
            serverLiked.delete(key)
          }
        }
        // Substitui o conjunto conhecido. Mesclar (o comportamento anterior)
        // fazia o estado só crescer: uma curtida desfeita em outra aba, ou um
        // POST que o servidor recusou, ficava presa na tela para sempre.
        likedEvents.value = [...serverLiked]
      } else {
        // Não deu para enumerar tudo, então a ausência de um id aqui não prova
        // que ele foi descurtido: mesclar é a opção segura.
        console.warn('Lista de curtidas excedeu o limite de varredura; mesclando em vez de substituir.')
        likedEvents.value = [...new Set([...likedEvents.value.map(String), ...serverLiked])]
      }

      isInitialized.value.liked = true
    } catch (error: any) {
      // Falha silenciosamente se o endpoint não existir (404)
      if (error?.status === 404 || error?.response?.status === 404) {
        console.warn('Endpoint de eventos curtidos não disponível (404). Usando o estado que vier nos próprios eventos.')
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
    pendingLikes.value.clear()
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
    registerEventLikeState,
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
