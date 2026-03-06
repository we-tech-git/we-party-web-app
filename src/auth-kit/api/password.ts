import { callApi } from './index'

/**
 * Solicita o reset de senha para um e-mail.
 * @param email - O e-mail do usuário.
 */
export function requestPasswordReset (email: string) {
  return callApi('POST', '/password/request-password-reset', { email })
}

/**
 * Verifica o PIN de reset de senha.
 * @param email - O e-mail do usuário.
 * @param pin - O PIN recebido por e-mail.
 */
export function requestVerifyToken (email: string, token: string) {
  return callApi('POST', '/password/verify-token', { email, token })
}

/**
 * Define uma nova senha.
 * @param email - O e-mail do usuário.
 * @param token - O token verificado.
 * @param password - A nova senha.
 */
export function requestSetNewPassord (token: string, newPassword: string) {
  return callApi('POST', '/password/set-new-password', { token, newPassword })
}
