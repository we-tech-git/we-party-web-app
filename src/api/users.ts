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
        Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN') || ''}`,
      },
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
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
      {
        Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN') || ''}`,
      },
    )
    return response
  } catch (error) {
    console.error('Erro ao fazer login:', error)
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
    console.error('Erro ao buscar perfil do usuário:', error)
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
    return response
  } catch (error) {
    console.error('Erro ao buscar interesses do usuário:', error)
    throw error
  }
}

/** Atualiza os dados do perfil do usuário */
export async function updateUserProfile (data: {
  name?: string
  username?: string
  bio?: string
  location?: string
}) {
  try {
    const response = await callApi(
      'PUT',
      '/users',
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
  formData.append('file', file)

  const token = localStorage.getItem('ACCESS_TOKEN')

  try {
    const response = await fetch(`${import.meta.env.VITE__BASE_URL}/users/profile-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Erro ao fazer upload da imagem')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao fazer upload da foto de perfil:', error)
    throw error
  }
}

/** Upload de foto de capa */
export async function uploadBannerImage (file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const token = localStorage.getItem('ACCESS_TOKEN')

  try {
    const response = await fetch(`${import.meta.env.VITE__BASE_URL}/users/banner-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Erro ao fazer upload da capa')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao fazer upload da capa:', error)
    throw error
  }
}
