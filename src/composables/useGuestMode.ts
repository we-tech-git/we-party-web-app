/**
 * useGuestMode Composable
 * Gerencia o modo guest/visitante para usuários não autenticados
 * permitindo visualização do feed mas bloqueando interações
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Estado global do dialog de login required
const showLoginRequiredDialog = ref(false)
const lastBlockedAction = ref<string>('')

/**
 * Detecta se a página atual está rodando dentro de um iframe (ex: o preview
 * do app embutido no mockup de celular da landing page). Nesse caso, navegar
 * com o router só troca o conteúdo do iframe — o usuário fica "preso" dentro
 * do componente 3D. Login/cadastro precisam sempre acontecer na janela de topo.
 */
export function isEmbeddedInIframe (): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.self !== window.top
  } catch {
    // Acesso a window.top bloqueado por cross-origin — trata como embutido
    return true
  }
}

export function useGuestMode () {
  const router = useRouter()

  /**
   * Mostra o dialog informando que login é necessário
   * @param actionName - Nome da ação bloqueada para contextualizar a mensagem
   */
  function requireLogin (actionName = 'acessar esta funcionalidade') {
    lastBlockedAction.value = actionName
    showLoginRequiredDialog.value = true
  }

  /**
   * Fecha o dialog de login required
   */
  function closeDialog () {
    showLoginRequiredDialog.value = false
    lastBlockedAction.value = ''
  }

  /**
   * Redireciona para a página de login
   */
  function goToLogin () {
    closeDialog()
    if (isEmbeddedInIframe() && window.top) {
      window.top.location.href = '/public/Login'
      return
    }
    router.push('/public/Login')
  }

  /**
   * Redireciona para a página de cadastro
   */
  function goToSignup () {
    closeDialog()
    if (isEmbeddedInIframe() && window.top) {
      window.top.location.href = '/public/Signup'
      return
    }
    router.push('/public/Signup')
  }

  return {
    // Estado
    showLoginRequiredDialog,
    lastBlockedAction,

    // Funções
    requireLogin,
    closeDialog,
    goToLogin,
    goToSignup,
  }
}
