/**
 * Normalização de eventos (curtidos/confirmados) pro card compacto do
 * perfil — usado tanto por `Profile.vue` (perfil próprio) quanto pela view
 * de perfil de terceiro (`pages/profile/[id].vue`).
 *
 * Extraído de `Profile.vue` (regra do AGENTS.md: extrair o que se toca em
 * vez de aumentar o monólito). Sem dependência de vue-i18n aqui de
 * propósito — os textos de fallback entram por parâmetro, então este
 * arquivo continua testável isolado e não amarra a um componente.
 */

export interface LikedEventItem {
  id: string | number
  banner: string
  creator: { name: string }
  hostAvatar: string
  schedule: string
  /** Data crua (ISO) do evento — `schedule` já vem formatada e não dá pra reparsear de forma confiável. */
  startDate?: string
  title: string
  description: string
  confirmed: number
  interested: number
  /** Local do evento — não confundir com a localização do perfil. */
  location?: string
  likes?: number
  interests?: string[]
  commentsCount?: number
}

export interface ProfileEventFallbacks {
  dateUndefined: string
  locationUndefined: string
  eventTitle: string
  soon: string
}

type RawEvent = any

/**
 * O payload de confirmados varia conforme a origem: `/events` traz
 * `confirmedCount`, enquanto o `event` aninhado em `eventAttendances` do
 * perfil vem só com `_count` (ou a própria lista de presenças). Tenta
 * todas as formas antes de cair em 0.
 */
export function resolveConfirmedCount (evt: RawEvent): number {
  const candidates = [
    evt?.confirmedCount,
    evt?.attendancesCount,
    evt?.attendeesCount,
    evt?._count?.attendances,
    evt?._count?.eventAttendances,
    evt?._count?.attendees,
    Array.isArray(evt?.attendances) ? evt.attendances.length : undefined,
    Array.isArray(evt?.eventAttendances) ? evt.eventAttendances.length : undefined,
    Array.isArray(evt?.attendees) ? evt.attendees.length : undefined,
  ]
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }
  return 0
}

export function mapLikedEvent (evt: RawEvent, fallbacks: ProfileEventFallbacks): LikedEventItem {
  const rawBanner = evt.bannerUrl || evt.banner || (Array.isArray(evt.photos) ? evt.photos[0] : '') || ''
  const hostName = evt.organizer?.name || evt.hostName || evt.creator?.name || 'Organizador'
  const resolveStartDate = (e: RawEvent): string | undefined => {
    const candidates = [e.date, e.startDate, e.dateTime, e.startAt, e.eventDate, e.start_date, e.schedule]
    for (const val of candidates) {
      if (val && !Number.isNaN(new Date(val).getTime())) {
        return new Date(val).toISOString()
      }
    }
    return undefined
  }
  const startDate = resolveStartDate(evt)
  const resolveSchedule = (): string => startDate
    ? new Date(startDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : fallbacks.dateUndefined
  return {
    id: evt.id,
    banner: rawBanner,
    creator: { name: hostName },
    hostAvatar: evt.organizer?.avatar || evt.hostAvatar || evt.creator?.profileImage || '',
    schedule: resolveSchedule(),
    startDate,
    location: evt.location || evt.address || fallbacks.locationUndefined,
    title: evt.name || evt.title || fallbacks.eventTitle,
    description: evt.description || '',
    confirmed: resolveConfirmedCount(evt),
    interested: evt.interestedCount || 0,
    likes: evt.likesCount || evt.likes || evt._count?.likes || 0,
    interests: (evt.eventInterests || evt.interests || evt.categories || [])

      .map((i: any) => typeof i === 'string' ? i : i.interest?.name || i.name)
      .filter(Boolean),
    commentsCount: evt.commentsCount ?? evt._count?.comments ?? 0,
  }
}

/**
 * O evento só está em `eventAttendances` porque o dono do perfil confirmou
 * presença — então `confirmed` é comprovadamente >= 1 mesmo quando o
 * payload enxuto do perfil não traz nenhum campo de contagem.
 */
export function mapConfirmedAttendance (evt: RawEvent, fallbacks: ProfileEventFallbacks): LikedEventItem {
  const mapped = mapLikedEvent(evt, fallbacks)
  return { ...mapped, confirmed: Math.max(1, mapped.confirmed) }
}

/** Mesmo raciocínio de `mapConfirmedAttendance`, pra aba "Curtidos". */
export function mapLikedEventItem (evt: RawEvent, fallbacks: ProfileEventFallbacks): LikedEventItem {
  const mapped = mapLikedEvent(evt, fallbacks)
  return { ...mapped, likes: Math.max(1, mapped.likes ?? 0) }
}

/** Data curta (`dd/mm`) pro card compacto. */
export function formatShortDate (dateString: string, soonFallback: string): string {
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return soonFallback
    }

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${day}/${month}`
  } catch {
    return soonFallback
  }
}
