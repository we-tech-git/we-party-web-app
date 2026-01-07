import { callApi } from '.'

export async function getEventRecomendations (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events/recommendations?page=${page}&limit=${limit}`,
      {},
      true,
      {
        Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN') || ''}`,
      },
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
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
      {
        Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN') || ''}`,
      },
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    throw error
  }
}

export async function getTrendingEvents (page = 1, limit = 10) {
  try {
    const response = await callApi(
      'GET',
      `/events/trending?page=${page}&limit=${limit}`,
      {},
      true,
      {
        Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN') || ''}`,
      },
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
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
      {
        Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN') || ''}`,
      },
    )
    return response
  } catch (error) {
    console.error('Erro ao buscar evento:', error)
    throw error
  }
}
