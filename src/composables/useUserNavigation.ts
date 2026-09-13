/**
 * useUserNavigation
 *
 * Centraliza a regra "meu perfil sempre abre na rota de edição, terceiro
 * sempre abre na rota pública" — usado em todo ponto clicável do app
 * (comentários, cards de evento, listas de seguidores/seguindo, busca de
 * amigos). Sem isso cada tela reimplementaria o mesmo `if` comparando com
 * `loggedUser.value.id`.
 */

import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

export function useUserNavigation () {
  const router = useRouter()
  const { loggedUser } = useAuth()

  /** Navega pro perfil de `userId` — próprio perfil vai pra rota de edição. */
  function goToProfile (userId: string | number | null | undefined) {
    if (!userId) {
      return
    }

    if (String(userId) === String(loggedUser.value?.id ?? '')) {
      router.push('/profile')
      return
    }

    router.push(`/profile/${userId}`)
  }

  return { goToProfile }
}
