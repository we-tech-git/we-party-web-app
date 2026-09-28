import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'
import { unwrapList } from '@/api'
import { getFollowers, getFollowing } from '@/api/follows'
import { useAuth } from '@/composables/useAuth'
import { type FollowPerson, pickMutualFollowers } from '@/utils/mutualFollowers'

/** Quantos avatares/nomes entram na frase "Seguido por A, B e mais N". */
const PREVIEW_LIMIT = 3

/**
 * "Seguido por quem você segue" no perfil de terceiro.
 *
 * Prova social secundária: se a requisição falhar (ou o visitante não estiver
 * logado) a lista fica vazia e nada aparece — nunca vira toast nem quebra o
 * perfil. Respostas fora de ordem (troca rápida de perfil) são descartadas.
 */
export function useMutualFollowers (profileId: MaybeRefOrGetter<string | undefined>, enabled: MaybeRefOrGetter<boolean> = true) {
  const { loggedUser } = useAuth()
  const mutuals = ref<FollowPerson[]>([])
  const loading = ref(false)
  let requestId = 0

  async function load () {
    const current = ++requestId
    const target = toValue(profileId)
    const viewerId = loggedUser.value?.id

    mutuals.value = []
    if (!target || !viewerId || !toValue(enabled)) {
      loading.value = false
      return
    }

    loading.value = true
    try {
      const [followersResponse, followingResponse] = await Promise.all([
        getFollowers(target),
        getFollowing(String(viewerId)),
      ])
      if (current !== requestId) {
        return
      }
      mutuals.value = pickMutualFollowers(
        unwrapList<FollowPerson>(followersResponse, 'followers'),
        unwrapList<FollowPerson>(followingResponse, 'following'),
        String(viewerId),
        target,
      )
    } catch {
      if (current === requestId) {
        mutuals.value = []
      }
    } finally {
      if (current === requestId) {
        loading.value = false
      }
    }
  }

  watch(
    () => [toValue(profileId), toValue(enabled), loggedUser.value?.id] as const,
    load,
    { immediate: true },
  )

  return {
    mutuals,
    loading,
    /** Os primeiros — os que aparecem nos avatares e no texto. */
    preview: computed(() => mutuals.value.slice(0, PREVIEW_LIMIT)),
    /** Quantos ficam de fora do preview ("e mais N"). */
    extraCount: computed(() => Math.max(0, mutuals.value.length - PREVIEW_LIMIT)),
  }
}
