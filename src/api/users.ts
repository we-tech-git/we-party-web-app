import { logger } from '@/utils/logger'
import { callApi } from './index'
import axios from 'axios'

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
    logger.error('Erro ao criar usuário:', error)
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
    logger.error('Erro ao fazer login:', error)
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
      false,
    )
    return response
  } catch (error) {
    logger.error('Erro ao verificar e-mail:', error)
    throw error
  }
}

export async function reqeustResendPin (email: string) {
  try {
    const response = await callApi(
      'POST',
      '/users/send-email-verification',
      { email },
      false,
    )
    return response
  } catch (error) {
    logger.error('Erro ao reenviar PIN:', error)
    throw error
  }
}

export async function requestConfirmEmail (email: string) {
  try {
    const response = await callApi(
      'POST',
      '/users/send-email-verification',
      { email },
      false,
    )
    return response
  } catch (error) {
    console.error('Erro ao confirmar e-mail:', error)
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
    )
    return response
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    throw error
  }
}

export async function getUserRecomendations () {
  try {
    const response = await callApi(
      'GET',
      '/social/recommendations',
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar recomendações de usuários:', error)
    throw error
  }
}

/**
 * Busca usuários por nome ou username
 * @param query - Termo de busca (nome ou username)
 * @param page - Página de resultados (padrão: 1)
 * @param limit - Limite de resultados por página (padrão: 20)
 */
export async function searchUsers (query: string, page = 1, limit = 20) {
  try {
    const response = await callApi(
      'GET',
      `/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      {},
      true,
    )
    return response
  } catch (error: any) {
    // Tratamento específico para endpoint não implementado
    if (error.response?.status === 404) {
      logger.warn('Endpoint de busca de usuários não implementado no backend')
      // Retorna resposta vazia ao invés de quebrar
      return {
        data: {
          success: false,
          message: 'Funcionalidade de busca temporariamente indisponível',
          data: [],
        },
        status: 200,
      }
    }
    logger.error('Erro ao buscar usuários:', error)
    throw error
  }
}

export function checkUserExists (email: string) {
  // A ordem provável dos parâmetros do seu callApi é: (URL, MÉTODO, DADOS)
  return callApi('POST', '/users/check-exists', { email })
}

/** Busca os dados do perfil de um usuário pelo ID */
export async function getUserProfile (userId: string) {
  try {
    const response = await callApi(
      'GET',
      `/users/${userId}`,
      {},
      true, // com autenticação
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar perfil do usuário:', error)
    throw error
  }
}

/** Busca os interesses do usuário logado */
export async function getUserInterests () {
  try {
    const response = await callApi(
      'GET',
      '/users/interests',
      {},
      true,
    )

    logger.log('📋 [Users API] getUserInterests response:', {
      status: response?.status,
      dataType: typeof response?.data,
      isArray: Array.isArray(response?.data),
      dataKeys: response?.data ? Object.keys(response.data) : 'null',
      sampleData: response?.data ? (Array.isArray(response.data) ? response.data[0] : response.data) : null,
    })

    return response
  } catch (error: any) {
    console.error('Erro ao buscar interesses do usuário:', error?.message)
    throw error
  }
}

/** Atualiza os dados do perfil do usuário */
export async function updateUserProfile (userId: string, data: {
  name?: string
  username?: string
  bio?: string
  location?: string
}) {
  try {
    const response = await callApi(
      'PUT',
      `/users/${userId}`,
      data,
      true,
    )
    return response
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    throw error
  }
}

/** Upload de foto de perfil */
export async function uploadProfileImage (file: File) {
  const formData = new FormData()
  formData.append('profilePhoto', file)

  const token = localStorage.getItem('ACCESS_TOKEN')
  const baseUrl = import.meta.env.VITE__BASE_URL

  if (!token) {
    throw new Error('Token de autenticação não encontrado')
  }

  try {
    const response = await axios({
      method: 'PATCH',
      url: `${baseUrl}/users/profile`,
      data: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      timeout: 30000,
      httpAgent: { keepAlive: true },
      httpsAgent: { keepAlive: true },
    })

    logger.log('✅ Foto de perfil enviada com sucesso')
    return response.data
  } catch (error: any) {
    const message = error.response?.data?.message || 'Erro ao fazer upload da foto de perfil'
    logger.error('❌ Erro ao fazer upload da foto de perfil:', message)
    throw new Error(message)
  }
}

/** Upload de foto de capa */
export async function uploadBannerImage (file: File) {
  const formData = new FormData()
  formData.append('coverPhoto', file)

  const token = localStorage.getItem('ACCESS_TOKEN')
  const baseUrl = import.meta.env.VITE__BASE_URL

  if (!token) {
    throw new Error('Token de autenticação não encontrado')
  }

  try {
    const response = await axios({
      method: 'PATCH',
      url: `${baseUrl}/users/profile`,
      data: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      timeout: 30000,
      httpAgent: { keepAlive: true },
      httpsAgent: { keepAlive: true },
    })

    logger.log('✅ Foto de capa enviada com sucesso')
    return response.data
  } catch (error: any) {
    const message = error.response?.data?.message || 'Erro ao fazer upload da capa'
    logger.error('❌ Erro ao fazer upload da capa:', message)
    throw new Error(message)
  }
}
