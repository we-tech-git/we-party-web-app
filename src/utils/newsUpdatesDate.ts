/**
 * Converte `releasedAt`/`expectedAt` (string) num `Date` local à meia-noite,
 * pra exibir só o dia/mês/ano sem depender de fuso horário.
 *
 * `GET /updates` devolve ISO datetime completo (`"2026-07-16T00:00:00.000Z"`),
 * enquanto o array estático antigo (`constants/newsUpdates.ts`) usava datas
 * puras (`"2026-07-16"`) — por isso corta tudo a partir do `T` antes de
 * separar ano/mês/dia. Sem isso, `new Date(NaN)` explode no
 * `Intl.DateTimeFormat.format()` com `RangeError: Invalid time value`
 * (era exatamente o bug: o parser assumia só o formato antigo).
 *
 * Construir com `new Date(year, month - 1, day)` (em vez de `new Date(iso)`)
 * é proposital: evita que o fuso do navegador jogue a data pro dia anterior
 * quando o ISO vem em UTC meia-noite e o visitante está num fuso negativo.
 */
export function parseUpdateDate (iso: string): Date {
  const datePart = iso.split('T')[0] ?? iso
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}
