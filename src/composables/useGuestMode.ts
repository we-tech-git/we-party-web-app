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
    router.push('/public/Login')
  }

  /**
   * Redireciona para a página de cadastro
   */
  function goToSignup () {
    closeDialog()
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
