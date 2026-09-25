/**
 * Filtros de data da lista de eventos ("Esta semana", "Este mês", "Mês que
 * vem"). Tudo em horário local do usuário. `now` é parâmetro só pra teste ser
 * determinístico.
 */

export type EventDateFilter = 'all' | 'week' | 'month' | 'nextMonth'

export const EVENT_DATE_FILTERS: EventDateFilter[] = ['all', 'week', 'month', 'nextMonth']

function startOfDay (date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays (date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Fim da semana (seg–dom) — exclusivo, ou seja, 00:00 da segunda seguinte. */
function endOfWeekExclusive (now: Date) {
  const day = now.getDay() // 0 = domingo
  const daysUntilSunday = day === 0 ? 0 : 7 - day
  return addDays(startOfDay(now), daysUntilSunday + 1)
}

export function matchesDateFilter (startDate: string, filter: EventDateFilter, now = new Date()): boolean {
  if (filter === 'all') {
    return true
  }

  const date = new Date(startDate)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  switch (filter) {
    // De hoje (00:00) até o domingo — não inclui dias que já passaram
    case 'week': {
      return date >= startOfDay(now) && date < endOfWeekExclusive(now)
    }
    case 'month': {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date >= startOfDay(now)
    }
    case 'nextMonth': {
      // `new Date(ano, mês + 1)` já resolve a virada de dezembro pra janeiro
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return date.getFullYear() === next.getFullYear() && date.getMonth() === next.getMonth()
    }
  }
}
