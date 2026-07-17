import { logger } from '@/utils/logger'
import { callApi } from '.'

// ============================================================
// FUNÇÕES PÚBLICAS (sem autenticação) - Para modo guest/explore
// ============================================================

/**
 * Busca eventos recomendados (público - sem autenticação)
 */
export async function getPublicEventRecomendations (page = 1, limit = 10, lat?: number, lng?: number) {
  const hasGeo = lat !== undefined && lng !== undefined
  const geoQuery = hasGeo ? `&lat=${lat}&lng=${lng}` : ''
  try {
    return await callApi(
      'GET',
      `/events/recommendations?page=${page}&limit=${limit}${geoQuery}`,
      {},
      false,
    )
  } catch (error: any) {
    logger.error('Erro ao buscar recomendações públicas:', error)
    throw error
  }
}

/**
 * Busca eventos em alta/trending (público - sem autenticação)
 */
export async function getPublicTrendingEvents (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events/top?page=${page}&limit=${limit}`,
      {},
      false, // Sem autenticação
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos em alta (público):', error)
    throw error
  }
}

/**
 * Calcula o intervalo de datas do mês atual para a aba "Acontecendo esse mês".
 * startDate = hoje (não o dia 1), pois eventos já passados do mês seriam removidos
 * pelo filtro do feed; começar pelo dia 1 fazia a 1ª página vir só com eventos
 * passados (paginação ordenada por data crescente), resultando em feed vazio.
 * endDate = primeiro dia do mês seguinte (exclusivo).
 */
function getCurrentMonthRange () {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based
  const pad = (n: number) => String(n).padStart(2, '0')

  // Começa a partir de hoje para trazer apenas eventos ainda por acontecer no mês
  const startDate = `${year}-${pad(month + 1)}-${pad(now.getDate())}`

  const nextMonthYear = month === 11 ? year + 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const endDate = `${nextMonthYear}-${pad(nextMonth + 1)}-01`

  return { startDate, endDate }
}

/**
 * Busca eventos do mês atual (público - sem autenticação)
 */
export async function getPublicEventsToday (page = 1, limit = 10) {
  try {
    const { startDate, endDate } = getCurrentMonthRange()

    const response = await callApi(
      'GET',
      `/events/by-date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`,
      {},
      false, // Sem autenticação
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos do mês (público):', error)
    throw error
  }
}

/**
 * Pesquisa eventos por nome (público - sem autenticação)
 */
export async function searchPublicEvents (search: string, page = 1, limit = 10, signal?: AbortSignal) {
  try {
    const response = await callApi(
      'GET',
      `/events/search/name?query=${search}&page=${page}&limit=${limit}`,
      {},
      false, // Sem autenticação
      undefined,
      signal,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos (público):', error)
    throw error
  }
}

/**
 * Busca TODOS os eventos (público - sem autenticação)
 * Não aplica filtros de recomendação baseados em interesses
 */
export async function getAllPublicEvents (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events?page=${page}&limit=${limit}`,
      {},
      false, // Sem autenticação
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar todos os eventos (público):', error)
    throw error
  }
}

// ============================================================
// FUNÇÕES AUTENTICADAS - Para usuários logados
// ============================================================

/**
 * Busca TODOS os eventos (autenticado)
 * Não aplica filtros de recomendação baseados em interesses
 */
export async function getAllEvents (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events?page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar todos os eventos:', error)
    throw error
  }
}

export async function getEventRecomendations (page = 1, limit = 10, lat?: number, lng?: number) {
  const hasGeo = lat !== undefined && lng !== undefined
  try {
    const geoHeaders = hasGeo
      ? { 'x-user-latitude': String(lat), 'x-user-longitude': String(lng) }
      : {}
    return await callApi(
      'GET',
      `/events/recommendations?page=${page}&limit=${limit}`,
      {},
      true,
      geoHeaders,
    )
  } catch (error: any) {
    logger.error('Erro ao buscar recomendações:', error)
    throw error
  }
}

export async function searchByEvents (search: string, page = 1, limit = 10, signal?: AbortSignal) {
  try {
    const response = await callApi(
      'GET',
      `/events/search/name?query=${search}&page=${page}&limit=${limit}`,
      {},
      true,
      undefined,
      signal,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos:', error)
    throw error
  }
}

export async function getTrendingEvents (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events/top?page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos em alta:', error)
    throw error
  }
}

export async function getEventsToday (page = 1, limit = 10) {
  try {
    const { startDate, endDate } = getCurrentMonthRange()

    const response = await callApi(
      'GET',
      `/events/by-date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos do mês:', error)
    throw error
  }
}

export async function getEventById (id: string | number) {
  try {
    const response = await callApi(
      'GET',
      `/events/${id}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar evento:', error)
    throw error
  }
}

export async function toggleLikeEvent (id: string | number) {
  try {
    const response = await callApi(
      'POST',
      `/events/${id}/likes`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao curtir evento:', error)
    throw error
  }
}

/**
 * Favorita ou desfavorita um evento.
 * @param eventId - ID do evento a ser favoritado/desfavoritado.
 */
export async function toggleFavoriteEvent (eventId: string | number) {
  try {
    const response = await callApi(
      'POST',
      `/events/${eventId}/favorite`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao favoritar evento:', error)
    throw error
  }
}

/**
 * Verifica se um evento está favoritado pelo usuário.
 * @param eventId - ID do evento a ser verificado.
 */
export async function getFavoriteStatus (eventId: string | number) {
  try {
    const response = await callApi(
      'GET',
      `/events/${eventId}/favorite/status`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao verificar status de favorito:', error)
    throw error
  }
}

/**
 * Lista os eventos favoritos do usuário.
 * @param page - Página de resultados.
 * @param limit - Quantidade de eventos por página.
 */
export async function getFavoriteEvents (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events/favorites?page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos favoritos:', error)
    throw error
  }
}

/**
 * Atualiza presença em um evento.
 * @param eventId - ID do evento.
 * @param status - Status da presença: "GOING", "INTERESTED" ou "NOT_GOING"
 */
export async function updateAttendance (eventId: string | number, status: 'GOING' | 'INTERESTED' | 'NOT_GOING') {
  try {
    const response = await callApi(
      'PUT',
      `/events/${eventId}/attendance`,
      { status },
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao atualizar presença:', error)
    throw error
  }
}

/**
 * Confirma presença em um evento (wrapper de updateAttendance).
 * @param eventId - ID do evento.
 */
export async function confirmAttendance (eventId: string | number) {
  return updateAttendance(eventId, 'GOING')
}

/**
 * Marca interesse em um evento.
 * @param eventId - ID do evento.
 */
export async function markAsInterested (eventId: string | number) {
  return updateAttendance(eventId, 'INTERESTED')
}

/**
 * Cancela presença em um evento (wrapper de updateAttendance).
 * @param eventId - ID do evento.
 */
export async function cancelAttendance (eventId: string | number) {
  return updateAttendance(eventId, 'NOT_GOING')
}

/**
 * Verifica se o usuário confirmou presença em um evento.
 * @param eventId - ID do evento.
 */
export async function getMyAttendance (eventId: string | number) {
  try {
    const response = await callApi(
      'GET',
      `/events/${eventId}/my-attendance`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.warn('Erro ao verificar minha presença:', error)
    return { data: { isAttending: false } }
  }
}

/**
 * @deprecated Use confirmAttendance ou cancelAttendance
 */
export async function toggleAttendance (eventId: string | number) {
  return confirmAttendance(eventId)
}

/**
 * Verifica status de presença em um evento.
 * @param eventId - ID do evento.
 */
export async function getAttendanceStatus (eventId: string | number) {
  try {
    const response = await callApi(
      'GET',
      `/events/${eventId}/attendance/status`,
      {},
      true,
    )
    return response
  } catch (error) {
    // Erro silencioso - endpoint pode não existir para todos os eventos
    logger.warn('Status de presença não disponível:', error)
    return { data: { isAttending: false } }
  }
}

/**
 * Busca eventos curtidos pelo usuário.
 * @param page - Página de resultados.
 * @param limit - Quantidade de eventos por página.
 */
export async function getLikedEvents (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events/likes?page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos curtidos:', error)
    throw error
  }
}

/**
 * Busca eventos em que o usuário confirmou presença.
 * @param page - Página de resultados.
 * @param limit - Quantidade de eventos por página.
 */
export async function getMyConfirmedEvents (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/users/me/attendances?page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar eventos confirmados:', error)
    throw error
  }
}
