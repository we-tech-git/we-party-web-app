import { callApi } from '.'

export interface CommentPayload {
  content: string
}

export interface CommentItem {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    profileImage?: string
  }
}

/**
 * Busca os comentários de um evento.
 */
export function getEventComments (eventId: string | number) {
  return callApi('GET', `/events/${eventId}/comments`, undefined, true)
}

/**
 * Adiciona um comentário a um evento.
 */
export function addEventComment (eventId: string | number, content: string, parentCommentId?: string) {
  const body: Record<string, any> = { content }
  if (parentCommentId) {
    body.parentCommentId = parentCommentId
  }
  return callApi('POST', `/events/${eventId}/comments`, body, true)
}

/**
 * Exclui um comentário de um evento.
 */
export function deleteEventComment (eventId: string | number, commentId: string) {
  return callApi('DELETE', `/events/${eventId}/comments/${commentId}`, undefined, true)
}

/**
 * Curtir / descurtir um comentário.
 */
export function toggleLikeComment (eventId: string | number, commentId: string) {
  return callApi('POST', `/events/${eventId}/comments/${commentId}/like`, undefined, true)
}
