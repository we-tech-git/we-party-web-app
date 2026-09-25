export interface RelatedInterest {
  id: string
  slug: string
  name: string
  emoji: string | null
  /** Em quantos dos eventos da página este interesse aparece — base do ranking. */
  eventCount: number
}

/**
 * "Quem curte X também curte…": interesses que aparecem juntos com o atual nos
 * eventos da página (`eventInterests[].interest`), mais frequentes primeiro.
 *
 * Só entra interesse APROVADO e com slug: a página pública responde 404 pra
 * qualquer outro, então um chip pra ele seria um link quebrado. Como o
 * payload da página traz só os eventos em destaque + próximos, é um ranking
 * "do que está em cartaz", não do catálogo inteiro.
 */
export function buildRelatedInterests (events: any[], currentInterestId: string, limit = 8): RelatedInterest[] {
  const found = new Map<string, RelatedInterest>()

  for (const event of events) {
    // Um interesse repetido dentro do mesmo evento conta uma vez só
    const seenInEvent = new Set<string>()

    for (const link of event?.eventInterests ?? []) {
      const interest = link?.interest
      if (
        !interest?.id
        || interest.id === currentInterestId
        || interest.status !== 'APPROVED'
        || !interest.slug
        || seenInEvent.has(interest.id)
      ) {
        continue
      }
      seenInEvent.add(interest.id)

      const existing = found.get(interest.id)
      if (existing) {
        existing.eventCount += 1
      } else {
        found.set(interest.id, {
          id: interest.id,
          slug: interest.slug,
          name: interest.name,
          emoji: interest.emoji ?? null,
          eventCount: 1,
        })
      }
    }
  }

  return [...found.values()]
    .toSorted((a, b) => b.eventCount - a.eventCount || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, limit)
}
