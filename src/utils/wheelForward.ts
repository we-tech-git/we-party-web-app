/**
 * Decide se o wheel de uma coluna lateral do feed (sidebar, tendências) deve
 * ser repassado pro feed central.
 *
 * Só repassa quando a coluna não tem o que rolar (conteúdo cabe na altura):
 * sem isso o shell `overflow: hidden` deixava o wheel sem destino e a página
 * parecia travada. Se a coluna rola, ela rola sozinha — e ao chegar no começo
 * ou no fim o wheel não vaza pro feed (WEPARTY-231: o feed inteiro andava
 * junto com a coluna).
 */
export function shouldForwardWheel (
  column: { scrollHeight: number, clientHeight: number },
  deltaY: number,
): boolean {
  if (deltaY === 0) {
    return false
  }
  return column.scrollHeight <= column.clientHeight + 1
}
