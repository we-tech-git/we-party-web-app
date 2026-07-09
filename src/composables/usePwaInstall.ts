/**
 * usePwaInstall Composable
 *
 * Gerencia a instalação do PWA da We Party:
 * - Captura o evento `beforeinstallprompt` (Chrome/Edge/Android) para oferecer
 *   um botão nativo de "Instalar app".
 * - Detecta se o app já está instalado (rodando em modo standalone).
 * - Detecta iOS/Safari, que não dispara o evento e exige instruções manuais
 *   ("Compartilhar" → "Adicionar à Tela de Início").
 *
 * O estado é compartilhado entre componentes (singleton em nível de módulo),
 * então múltiplos botões refletem a mesma situação.
 */
import { computed, onMounted, readonly, ref } from 'vue'
import { logger } from '@/utils/logger'

// Tipagem do evento não-padrão `beforeinstallprompt`
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
  prompt: () => Promise<void>
}

// Estado global (singleton) — inicializado uma única vez
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstalled = ref(false)
let listenersReady = false

function detectStandalone (): boolean {
  if (typeof window === 'undefined') return false
  const displayStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  // iOS Safari usa a flag proprietária navigator.standalone
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return displayStandalone || iosStandalone
}

function detectIOS (): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isIOSDevice = /ipad|iphone|ipod/i.test(ua)
  // iPadOS moderno se apresenta como "Macintosh" com touch
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isIOSDevice || isIPadOS
}

function initListeners () {
  if (listenersReady || typeof window === 'undefined') return
  listenersReady = true

  isInstalled.value = detectStandalone()

  window.addEventListener('beforeinstallprompt', event => {
    // Impede o mini-infobar automático; guardamos para disparar no clique
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
    logger.log('[PWA] beforeinstallprompt capturado — app instalável')
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    isInstalled.value = true
    logger.log('[PWA] app instalado com sucesso')
  })
}

export function usePwaInstall () {
  const isIOS = detectIOS()
  const showIOSInstructions = ref(false)

  onMounted(() => {
    initListeners()
    // Reavalia caso o composable seja montado após o app já estar em standalone
    if (detectStandalone()) isInstalled.value = true
  })

  // Pode instalar via prompt nativo (Android/Chrome/Edge/desktop)
  const canPromptInstall = computed(() => !isInstalled.value && deferredPrompt.value !== null)

  // Deve mostrar o botão? (prompt disponível OU iOS que ainda não instalou)
  const canInstall = computed(() =>
    !isInstalled.value && (deferredPrompt.value !== null || isIOS),
  )

  async function promptInstall (): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    // iOS não suporta prompt programático — exibe instruções
    if (isIOS && !canPromptInstall.value) {
      showIOSInstructions.value = true
      return 'unavailable'
    }

    const promptEvent = deferredPrompt.value
    if (!promptEvent) return 'unavailable'

    try {
      await promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      logger.log('[PWA] escolha do usuário:', outcome)
      // O evento só pode ser usado uma vez
      deferredPrompt.value = null
      if (outcome === 'accepted') isInstalled.value = true
      return outcome
    } catch (error) {
      logger.error('[PWA] erro ao instalar:', error)
      return 'unavailable'
    }
  }

  return {
    canInstall,
    canPromptInstall,
    isInstalled: readonly(isInstalled),
    isIOS,
    showIOSInstructions,
    promptInstall,
  }
}
