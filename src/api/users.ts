import { callApi } from './index'

interface NewUser {
  name: string
  username: string
  phone: string
  email: string
  password: string
  acceptedTerms: boolean
  notificationActive: boolean
}

interface LoginCredentials {
  email: string
  password: string
}

/** Cria um novo usuário no sistema */

export async function createUser (userData: NewUser) {
  try {
    const response = await callApi(
      'POST',
      '/users',
      userData,
      false, // sem autenticação, pois o usuario ainda não está logado
    )
    return response
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    throw error
  }
}

/** Faz login do usuário no sistema */
export async function loginUser (credentials: LoginCredentials) {
  try {
    const response = await callApi(
      'POST',
      '/users/login',
      credentials,
      false, // sem autenticação, pois o usuario ainda não está logado
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    throw error
  }
}

export async function reqeustSendPin ({
  email,
  code,
}: {
  email: string
  code: string
}) {
  try {
    const response = await callApi(
      'POST',
      '/users/verify-email',
      { email, code },
      false, // sem autenticação, pois o usuario ainda não está logado
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    throw error
  }
}

export async function reqeustResendPin (email: string) {
  try {
    const response = await callApi(
      'POST',
      '/users/send-email-verification',
      { email },
      false, // sem autenticação, pois o usuario ainda não está logado
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    throw error
  }
}

export async function requestConfirmEmail (email: string) {
  try {
    const response = await callApi(
      'POST',
      '/users/send-email-verification',
      { email },
      false, // sem autenticação, pois o usuario ainda não está logado
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    throw error
  }
}

export async function deleteUser () {
  try {
    const response = await callApi(
      'DELETE',
      '/users',
      {},
      true,
      {
        'Authorization': `Bearer ${localStorage.getItem('ACCESS_TOKEN') || ''}`,
      }
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    throw error
  }
}
