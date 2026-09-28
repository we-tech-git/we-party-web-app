/**
 * "Quando" de um evento em relação a hoje — usado pelos cards do perfil
 * (etiqueta "Hoje"/"Amanhã"/"Em 3 dias", esmaecer o que já passou e separar
 * "Próximos" de "Já rolou"). Calendário em horário local do usuário; `now` é
 * parâmetro só pra teste ser determinístico.
 */

export type EventTimingKind = 'today' | 'tomorrow' | 'soon' | 'later' | 'past' | 'unknown'

export interface EventTiming {
  kind: EventTimingKind
  /** Dias de calendário até o evento (negativo se já passou). `null` sem data válida. */
  days: number | null
}

/** Até quantos dias a frente vale mostrar a etiqueta "Em N dias". */
export const SOON_THRESHOLD_DAYS = 7

const MS_PER_DAY = 86_400_000

function startOfDay (date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseDate (value: string | undefined | null) {
  if (!value) {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getEventTiming (startDate: string | undefined | null, now = new Date()): EventTiming {
  const date = parseDate(startDate)
  if (!date) {
    return { kind: 'unknown', days: null }
  }

  // Diferença em dias de CALENDÁRIO (não em blocos de 24h): um evento hoje às
  // 22h e "agora" às 23h continuam sendo "hoje". `Math.round` absorve a hora
  // a mais/menos das viradas de horário de verão.
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / MS_PER_DAY)

  if (days < 0) {
    return { kind: 'past', days }
  }
  if (days === 0) {
    return { kind: 'today', days }
  }
  if (days === 1) {
    return { kind: 'tomorrow', days }
  }
  return { kind: days <= SOON_THRESHOLD_DAYS ? 'soon' : 'later', days }
}

/**
 * "sáb, 08/08 · 20:00". Sem data válida devolve `fallback` — o chamador
 * decide o texto ("Data a definir", "Em breve"...).
 */
export function formatEventDateLabel (startDate: string | undefined | null, locale: string, fallback: string): string {
  const date = parseDate(startDate)
  if (!date) {
    return fallback
  }

  const day = date.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '')
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

/**
 * Separa em "próximos" (mais perto primeiro) e "já rolou" (mais recente
 * primeiro). Evento sem data válida fica em "próximos", no fim da lista — é
 * "data a definir", não passado.
 */
export function partitionByTiming<T extends { startDate?: string }> (items: T[], now = new Date()) {
  const upcoming: T[] = []
  const past: T[] = []

  for (const item of items) {
    if (getEventTiming(item.startDate, now).kind === 'past') {
      past.push(item)
    } else {
      upcoming.push(item)
    }
  }

  const time = (item: T) => parseDate(item.startDate)?.getTime()

  upcoming.sort((a, b) => (time(a) ?? Number.POSITIVE_INFINITY) - (time(b) ?? Number.POSITIVE_INFINITY))
  past.sort((a, b) => (time(b) ?? 0) - (time(a) ?? 0))

  return { upcoming, past }
}
