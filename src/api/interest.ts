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
