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
 * Adiciona um comentário raiz a um evento.
 *
 * @param parentCommentId - forma legada de responder, mantida para
 * CommentsDrawer/EventDetails, que ainda não migraram. Para respostas
 * aninhadas prefira `replyToComment`.
 */
export function addEventComment (eventId: string | number, content: string, parentCommentId?: string) {
  const body: Record<string, any> = { content }
  if (parentCommentId) {
    body.parentCommentId = parentCommentId
  }
  return callApi('POST', `/events/${eventId}/comments`, body, true)
}

/**
 * Responde a um comentário existente, criando um nó filho na árvore.
 * O backend rejeita com 400 se o pai já estiver no nível MAX_COMMENT_DEPTH.
 */
export function replyToComment (eventId: string | number, commentId: string, content: string) {
  return callApi('POST', `/events/${eventId}/comments/${commentId}/reply`, { content }, true)
}

/**
 * Exclui um comentário de um evento.
 */
export function deleteEventComment (eventId: string | number, commentId: string) {
  return callApi('DELETE', `/events/${eventId}/comments/${commentId}`, undefined, true)
}

/**
 * Curtir / descurtir um comentário (toggle).
 */
export function toggleLikeComment (eventId: string | number, commentId: string) {
  return callApi('POST', `/events/${eventId}/comments/${commentId}/likes`, undefined, true)
}

/**
 * Lista os likes de um comentário, paginado. A resposta traz também a
 * contagem total e se o usuário logado curtiu.
 */
export function getCommentLikes (eventId: string | number, commentId: string, page = 1, limit = 10) {
  return callApi('GET', `/events/${eventId}/comments/${commentId}/likes?page=${page}&limit=${limit}`, undefined, true)
}
