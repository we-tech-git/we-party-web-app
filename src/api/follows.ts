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

export async function requestUnFollowUser (user: User) {
  try {
    const response = await callApi(
      'DELETE',
      '/follow',
      {
        followingId: user.id,
      },
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
