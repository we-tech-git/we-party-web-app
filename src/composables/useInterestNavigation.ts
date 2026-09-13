/**
 * useInterestNavigation
 *
 * Centraliza a navegação para a landing page pública de um interesse
 * (`/interests/:slugOrId`). O backend resolve slug **ou** id em
 * `GET /interest/:id/page`, então basta o identificador que o chip tiver.
 */

import { useRouter } from 'vue-router'

export function useInterestNavigation () {
  const router = useRouter()

  /** Abre a página pública do interesse. Aceita slug ou id. */
  function goToInterest (slugOrId: string | number | null | undefined) {
    if (slugOrId === null || slugOrId === undefined || slugOrId === '') {
      return
    }

    router.push(`/interests/${slugOrId}`)
  }

  return { goToInterest }
}
