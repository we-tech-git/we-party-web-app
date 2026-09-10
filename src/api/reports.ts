import { callApi } from './index'

export type ReportType = 'EVENT' | 'COMMENT' | 'INTEREST_COMMENT'

/**
 * `POST /reports` — denunciar evento/comentário/comentário de interesse.
 * Usado agora pela ação "Reportar" no comentário de interesse (ver
 * `InlineComments.vue`); o mesmo endpoint já serve `EVENT`/`COMMENT` pra
 * quando essa ação for ligada em comentário de evento também.
 */
export function createReport (
  type: ReportType,
  targetId: string,
  reason?: string,
) {
  const body: Record<string, string> = { type }
  if (type === 'EVENT') {
    body.eventId = targetId
  }
  if (type === 'COMMENT') {
    body.commentId = targetId
  }
  if (type === 'INTEREST_COMMENT') {
    body.interestCommentId = targetId
  }
  if (reason) {
    body.reason = reason
  }
  return callApi('POST', '/reports', body, true)
}
