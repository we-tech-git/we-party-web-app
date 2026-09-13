import type { NewsUpdate } from '@/constants/newsUpdates'
import { logger } from '@/utils/logger'
import { callApi } from '.'

/**
 * Busca as novidades publicadas da plataforma (público — sem autenticação).
 * Alimenta a página /updates. O backend só devolve o que um admin já
 * publicou pelo CMS — nunca rascunho.
 */
export async function getPublicUpdates (): Promise<NewsUpdate[]> {
  try {
    const response = await callApi('GET', '/updates', {}, false)
    return response.data
  } catch (error) {
    logger.error('Erro ao buscar novidades públicas:', error)
    throw error
  }
}
