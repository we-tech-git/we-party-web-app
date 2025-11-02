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
