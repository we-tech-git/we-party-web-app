import { callApi } from './index'

/**
 * Solicita o reset de senha para um e-mail.
 * @param email - O e-mail do usuário.
 */
export function requestPasswordReset (email: string) {
  return callApi('POST', '/auth/forgot-password', { email })
}

/**
 * Verifica o PIN de reset de senha.
 * @param email - O e-mail do usuário.
 * @param pin - O PIN recebido por e-mail.
 */
export function verifyPasswordResetPin (email: string, pin: string) {
  return callApi('POST', '/auth/verify-pin', { email, pin })
}

/**
 * Define uma nova senha.
 * @param email - O e-mail do usuário.
 * @param pin - O PIN verificado.
 * @param password - A nova senha.
 */
export function resetPassword (email: string, pin: string, password: string) {
  return callApi('POST', '/auth/reset-password', { email, pin, password })
}
