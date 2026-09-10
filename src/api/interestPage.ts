import { callApi } from './index'

/**
 * Wrappers finos por `callApi` pra `/interest/:id/*` — mesmo padrão de
 * `api/interest.ts`/`api/comments.ts`. `auth: true` em toda rota, mesmo as
 * de leitura (`OptionalAuthGuard` no backend): sem o header, o backend não
 * tem como saber quem pergunta e a personalização (isFollowing, "quem eu
 * sigo") nunca aparece pra quem está logado. Visitante anônimo não tem
 * token no localStorage — o header vira `Bearer null`, o backend descarta
 * e trata como anônimo, sem erro.
 */

export function getInterestPage (interestId: string | number) {
  return callApi('GET', `/interest/${interestId}/page`, undefined, true)
}

export function getInterestEvents (
  interestId: string | number,
  opts: { featured?: boolean, upcoming?: boolean, page?: number, limit?: number } = {},
) {
  const params = new URLSearchParams()
  if (opts.featured) {
    params.set('featured', 'true')
  }
  if (opts.upcoming) {
    params.set('upcoming', 'true')
  }
  if (opts.page) {
    params.set('page', String(opts.page))
  }
  if (opts.limit) {
    params.set('limit', String(opts.limit))
  }
  const qs = params.toString()
  return callApi('GET', `/interest/${interestId}/events${qs ? `?${qs}` : ''}`, undefined, true)
}

export function getInterestFollowers (interestId: string | number, limit = 20, offset = 0) {
  return callApi('GET', `/interest/${interestId}/followers?limit=${limit}&offset=${offset}`, undefined, true)
}

export function getInterestActivities (interestId: string | number, limit = 20, offset = 0) {
  return callApi('GET', `/interest/${interestId}/activities?limit=${limit}&offset=${offset}`, undefined, true)
}

export function followInterest (interestId: string | number) {
  return callApi('POST', `/interest/${interestId}/follow`, undefined, true)
}

export function unfollowInterest (interestId: string | number) {
  return callApi('DELETE', `/interest/${interestId}/follow`, undefined, true)
}

export function getInterestComments (interestId: string | number, page = 1, limit = 10, repliesLimit = 10) {
  return callApi(
    'GET',
    `/interest/${interestId}/comments?page=${page}&limit=${limit}&repliesLimit=${repliesLimit}`,
    undefined,
    true,
  )
}

export function addInterestComment (interestId: string | number, content: string) {
  return callApi('POST', `/interest/${interestId}/comments`, { content }, true)
}

export function replyToInterestComment (interestId: string | number, commentId: string, content: string) {
  return callApi('POST', `/interest/${interestId}/comments/${commentId}/reply`, { content }, true)
}

export function deleteInterestComment (interestId: string | number, commentId: string) {
  return callApi('DELETE', `/interest/${interestId}/comments/${commentId}`, undefined, true)
}

export function toggleLikeInterestComment (interestId: string | number, commentId: string) {
  return callApi('POST', `/interest/${interestId}/comments/${commentId}/likes`, undefined, true)
}
