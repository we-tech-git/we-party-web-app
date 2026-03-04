/**
 * useThemeMode Composable — dark mode desabilitado
 * Mantido para compatibilidade, sempre retorna modo claro.
 */
import { ref } from 'vue'

// Garante remoção da classe dark caso tenha ficado no localStorage
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark')
}
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('DARK_MODE')
}

const isDark = ref(false)

export function useThemeMode () {
  const toggleDark = () => { /* desabilitado */ }
  const setDark = (_value: boolean) => { /* desabilitado */ }
  return { isDark, toggleDark, setDark }
}
