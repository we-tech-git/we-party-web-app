// tailwind.config.ts (Tailwind v4)
export default {
  // prefixa todas as utilities pra evitar colisão: tw-mx-4, tw-text-lg, etc.
  prefix: '',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          500: '#6366f1',
          600: '#4f46e5',
        },
        fontFamily: {
          sans: ['Poppins', ...fontFamily.sans],
        },
      },
    },
  },
  // v4 descobre o conteúdo automaticamente, mas você pode explicitar se quiser:
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx,js,jsx}',
  ],
}
