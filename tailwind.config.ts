import defaultTheme from 'tailwindcss/defaultTheme'

// tailwind.config.ts (Tailwind v4)
export default {
  // Ativa dark mode por classe CSS: html.dark { ... }
  darkMode: 'class',
  // Sem prefixo nas utilities (nunca foi ativado apesar do que um comentário
  // antigo aqui dizia — corrigido na Fase 2 do REFACTOR_AUDIT_PLAN.md).
  prefix: '',
  theme: {
    extend: {
      colors: {
        // Referencia src/styles/tokens.css — nunca hex-code novo aqui (Fase 2).
        brand: {
          50: '#fff5f7',
          500: 'var(--color-primary)',
          600: 'var(--color-secondary)',
        },
      },
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  // v4 descobre o conteúdo automaticamente, mas você pode explicitar se quiser:
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx,js,jsx}',
  ],
}
