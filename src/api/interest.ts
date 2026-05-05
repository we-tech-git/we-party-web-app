import { logger } from '@/utils/logger'
import { callApi } from './index'

/**
 * Busca a lista de todos os interesses disponíveis.
 * Rota autenticada.
 */
export async function getInterests () {
  try {
    const response = await callApi('GET', '/interest', undefined, true)

    logger.log('📋 [Interest API] getInterests response:', {
      status: response?.status,
      dataType: typeof response?.data,
      isArray: Array.isArray(response?.data),
      dataKeys: response?.data ? Object.keys(response.data) : 'null',
      sampleData: response?.data ? (Array.isArray(response.data) ? response.data[0] : response.data) : null,
    })

    return response
  } catch (error: any) {
    logger.error('❌ [Interest API] Erro ao buscar interesses:', error?.message)
    throw error
  }
}

/**
 * Busca interesses recomendados/aleatórios para seleção inicial.
 * Retorna até 10 interesses para o usuário escolher ao criar perfil.
 * Rota autenticada.
 */
export function getRecommendedInterests (limit = 10) {
  return callApi('GET', `/interest?limit=${limit}`, undefined, true)
}

/**
 * Busca interesses por nome.
 * Rota autenticada.
 * @param query - O termo de busca para filtrar interesses por nome.
 */
export function searchInterestsByName (query: string) {
  return callApi('GET', `/interest/search-by-name?q=${encodeURIComponent(query)}`, undefined, true)
}

/**
 * Adiciona um interesse para o usuário logado.
 * Rota autenticada.
 * @param interestId - O ID do interesse a ser adicionado.
 */
export function addUserInterest (interestId: string) {
  const body = { interestId }
  return callApi('POST', '/users/interest', body, true)
}

/**
 * Remove um interesse do usuário logado.
 * Rota autenticada.
 * @param interestId - O ID do interesse a ser removido.
 */
export function removeUserInterest (interestId: string) {
  return callApi('DELETE', `/users/interest/${interestId}`, undefined, true)
}

/**
 * Salva uma lista de interesses para o usuário logado.
 * Substitui os interesses existentes do usuário.
 * @param interestIds - Um array com os IDs dos interesses a serem salvos.
 */
export function saveUserInterests (interestIds: string[]) {
  const body = { interestIds }
  // Usamos 'PUT' pois é semanticamente correto para substituir um recurso.
  return callApi('PUT', '/users/interest', body, true)
}

/**
 * Solicita a criação de novos interesses para avaliação.
 * Envia uma lista de nomes de interesses que não existem no sistema
 * para o backend avaliar e aprovar/criar posteriormente.
 * Rota autenticada.
 * @param interestNames - Um array com os nomes dos interesses solicitados.
 */
export function requestNewInterests (interestNames: string[]) {
  const body = { interests: interestNames }
  return callApi('POST', '/interest/request', body, true)
}

/**
 * Envia a sugestão de um novo interesse para aprovação dos desenvolvedores.
 * O interesse fica com status "pendente" até ser aprovado/rejeitado.
 * Rota autenticada.
 * @param name - O nome do interesse sugerido pelo usuário.
 */
export function suggestInterest (name: string) {
  const body = { name }
  return callApi('POST', '/create/interest', body, true)
}
