import type { User } from '@/components/modules/AddFriends/AddFriends.vue'
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
    console.error('Erro ao seguir usuário:', error)
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
    console.error('Erro ao deixar de seguir usuário:', error)
    throw error
  }
}
