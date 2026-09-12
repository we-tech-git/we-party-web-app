import tseslint from '@typescript-eslint/eslint-plugin'
import vuetify from 'eslint-config-vuetify'

export default vuetify(
  // Fase 7 do REFACTOR_AUDIT_PLAN.md (B5): 197 ocorrências de `any`/`as any`
  // já existiam no código antes desta regra — corrigir tudo de uma vez não
  // é desta fase. `warn` (não `error`) sinaliza uso novo sem quebrar
  // `yarn lint` nem bloquear PR por causa do legado. O plugin precisa ser
  // redeclarado neste objeto (flat config exige `plugins` no mesmo objeto
  // em que a regra é usada), mesmo já vindo registrado dentro de `vuetify()`.
  {
    files: ['**/*.{ts,tsx,vue}'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
