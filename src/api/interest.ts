import { callApi } from './index'

/**
 * Busca a lista de todos os interesses disponíveis.
 * Rota autenticada.
 */
export function getInterests () {
  return callApi('GET', '/interest', undefined, true)
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
