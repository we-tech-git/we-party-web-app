import { callApi } from '.'

export async function getEventRecomendations (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events/recommendations?page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    console.error('Erro ao buscar recomendações:', error)
    throw error
  }
}

export async function searchByEvents (search: string, page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events/search/name?query=${search}&page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
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
    console.error('Erro ao buscar eventos em alta:', error)
    throw error
  }
}

export async function getEventsToday (page = 1, limit = 10) {
  try {
    const now = new Date()
    const startDate = now.toISOString().split('T')[0]

    const nextDay = new Date(now)
    nextDay.setDate(now.getDate() + 1)
    const endDate = nextDay.toISOString().split('T')[0]

    const response = await callApi(
      'GET',
      `/events/by-date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    console.error('Erro ao buscar eventos de hoje:', error)
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
    console.error('Erro ao buscar evento:', error)
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
    console.error('Erro ao curtir evento:', error)
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
    console.error('Erro ao favoritar evento:', error)
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
    console.error('Erro ao verificar status de favorito:', error)
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
    console.error('Erro ao buscar eventos favoritos:', error)
    throw error
  }
}

/**
 * Confirma ou cancela presença em um evento.
 * @param eventId - ID do evento.
 */
export async function toggleAttendance (eventId: string | number) {
  try {
    const response = await callApi(
      'PUT',
      `/events/${eventId}/attendance`,
      {},
      true,
    )
    return response
  } catch (error) {
    console.error('Erro ao confirmar presença:', error)
    throw error
  }
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
    console.error('Erro ao verificar presença:', error)
    throw error
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
      `/users/liked-events?page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error) {
    console.error('Erro ao buscar eventos curtidos:', error)
    throw error
  }
}
