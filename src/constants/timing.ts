/**
 * Constantes centrais de timing (debounce, throttle, cooldown, retry).
 *
 * Fonte única de verdade para os tempos usados em buscas, eventos contínuos
 * (scroll/resize), cooldowns de UX e política de retry do cliente HTTP.
 *
 * Critério de escolha:
 * - Debounce  → esperar o usuário PARAR (busca ao digitar, validação, autosave)
 * - Throttle  → limitar frequência de evento CONTÍNUO (scroll, resize, mousemove com trabalho)
 * - Cooldown  → bloquear uma ação por um período fixo (reenvio de código)
 * - Retry     → nova tentativa com backoff, apenas para requisições idempotentes (GET)
 */

/** Debounce da busca ao digitar (ms). Mantém o valor atual do SearchInput. */
export const SEARCH_DEBOUNCE_MS = 500

/** Throttle de listeners de scroll (ms). */
export const SCROLL_THROTTLE_MS = 100

/** Throttle de listeners de resize (ms). */
export const RESIZE_THROTTLE_MS = 150

/** Cooldown para reenvio de código/PIN (segundos). */
export const RESEND_COOLDOWN_S = 60

/** Número máximo de tentativas de retry do cliente HTTP (apenas GET). */
export const HTTP_RETRY_MAX = 2

/** Tempo base do backoff exponencial de retry (ms). */
export const HTTP_RETRY_BASE_MS = 500

/**
 * Teto de espera antes de um retry (ms), mesmo que o servidor peça mais via
 * header `Retry-After`. Evita que um valor hostil ou mal configurado prenda
 * a UI esperando indefinidamente.
 */
export const HTTP_RETRY_MAX_WAIT_MS = 10_000
