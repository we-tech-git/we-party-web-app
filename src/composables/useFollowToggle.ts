import type { Ref } from 'vue'
import { followUserById, unfollowUserById } from '@/api/follows'

interface Followable {
  id: string | number
  isFollowing?: boolean
}

interface UseFollowToggleOptions<T extends Followable> {
  /**
   * Listas independentes onde a mesma pessoa pode aparecer (seguidores,
   * recomendações, resultado de busca), cada uma com seu próprio objeto.
   * Qualquer mudança de follow precisa refletir em todas, senão o botão
   * fica desatualizado até recarregar a página.
   */
  lists: Ref<T[]>[]
  /** Depois que a API confirmou. `nowFollowing` é o estado novo. */
  onSuccess?: (user: T, nowFollowing: boolean) => void
  /** Depois de reverter o estado otimista. */
  onError?: (error: unknown, user: T) => void
}

/**
 * Seguir/deixar de seguir com atualização otimista (AGENTS.md, regra 2):
 * o estado muda no clique, é revertido se a API falhar e um segundo clique na
 * mesma pessoa é ignorado enquanto o primeiro está pendente. Toast e
 * contadores ficam com a tela, via `onSuccess`/`onError`.
 */
export function useFollowToggle<T extends Followable> ({ lists, onSuccess, onError }: UseFollowToggleOptions<T>) {
  const pendingIds = new Set<T['id']>()

  function setFollowState (user: T, isFollowing: boolean) {
    for (const list of lists) {
      for (const person of list.value) {
        if (person.id === user.id) {
          person.isFollowing = isFollowing
        }
      }
    }
    // O objeto clicado pode não estar em nenhuma das listas.
    user.isFollowing = isFollowing
  }

  async function toggleFollow (user: T) {
    if (pendingIds.has(user.id)) {
      return
    }
    pendingIds.add(user.id)

    const wasFollowing = !!user.isFollowing
    setFollowState(user, !wasFollowing)

    try {
      await (wasFollowing ? unfollowUserById(user.id) : followUserById(user.id))
      onSuccess?.(user, !wasFollowing)
    } catch (error) {
      setFollowState(user, wasFollowing)
      onError?.(error, user)
    } finally {
      pendingIds.delete(user.id)
    }
  }

  return { toggleFollow }
}
