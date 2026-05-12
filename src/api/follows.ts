import type { User } from '@/components/modules/AddFriends/AddFriends.vue'
import { logger } from '@/utils/logger'
import { callApi } from './index'

export async function requestFollowUser (user: User) {
  try {
    const response = await callApi(
      'POST',
      '/follow',
      {
        followingId: user.id,
      },
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao seguir usuário:', error)
    throw error
  }
}

export async function requestUnFollowUser (user: User) {
  try {
    const response = await callApi(
      'DELETE',
      '/follow',
      {
        followingId: user.id,
      },
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao deixar de seguir usuário:', error)
    throw error
  }
}

/**
 * Busca seguidores de um usuário específico
 * @param userId - ID do usuário
 */
export async function getFollowers (userId: string | number) {
  try {
    const response = await callApi(
      'GET',
      `/follow/followers/${userId}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar seguidores:', error)
    throw error
  }
}

/**
 * Busca usuários que um usuário específico segue
 * @param userId - ID do usuário
 */
export async function getFollowing (userId: string | number) {
  try {
    const response = await callApi(
      'GET',
      `/follow/following/${userId}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar seguindo:', error)
    throw error
  }
}

/**
 * Busca estatísticas de seguidores/seguindo de um usuário
 * @param userId - ID do usuário
 */
export async function getFollowStats (userId: string | number) {
  try {
    const response = await callApi(
      'GET',
      `/follow/stats/${userId}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de follow:', error)
    throw error
  }
}

/**
 * Verifica se o usuário logado segue um usuário específico
 * @param followingId - ID do usuário a verificar
 */
export async function checkIsFollowing (followingId: string | number) {
  try {
    const response = await callApi(
      'GET',
      `/follow/check/${followingId}`,
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao verificar follow:', error)
    throw error
  }
}

/**
 * Busca os seguidores do usuário logado
 */
export async function getMyFollowers () {
  try {
    const response = await callApi(
      'GET',
      '/follow/my-followers',
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar meus seguidores:', error)
    throw error
  }
}

/**
 * Busca os usuários que o usuário logado segue
 */
export async function getMyFollowing () {
  try {
    const response = await callApi(
      'GET',
      '/follow/my-following',
      {},
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao buscar quem eu sigo:', error)
    throw error
  }
}

/**
 * Seguir usuário por ID (simplificado)
 * @param userId - ID do usuário a seguir
 */
export async function followUserById (userId: string | number) {
  try {
    const response = await callApi(
      'POST',
      '/follow',
      {
        followingId: userId,
      },
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao seguir usuário:', error)
    throw error
  }
}

/**
 * Deixar de seguir usuário por ID (simplificado)
 * @param userId - ID do usuário a deixar de seguir
 */
export async function unfollowUserById (userId: string | number) {
  try {
    const response = await callApi(
      'DELETE',
      '/follow',
      {
        followingId: userId,
      },
      true,
    )
    return response
  } catch (error) {
    logger.error('Erro ao deixar de seguir usuário:', error)
    throw error
  }
}
