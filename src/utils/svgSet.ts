export type StrokeLinecap = 'butt' | 'round' | 'square'
export type StrokeLinejoin = 'miter' | 'round' | 'bevel'
export type FillRule = 'nonzero' | 'evenodd'

export type SvgPath = {
  d: string
  fillRule?: FillRule
  clipRule?: FillRule
  strokeLinecap?: StrokeLinecap
  strokeLinejoin?: StrokeLinejoin
}

export type SvgIcon = {
  viewBox: string
  paths: SvgPath[]
}

export const svgIcons: Record<string, SvgIcon> = {
  // searchIcon
  // Origem: SVG de ícone de busca (estilo Heroicons / ícone custom)
  // Uso: campo de busca em AddFriends.vue (barra de pesquisa)
  searchIcon: {
    viewBox: '0 0 20 20',
    paths: [
      {
        d: 'M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  // planeIcon
  // Origem: ícone de avião (provavelmente Heroicons 'paper-airplane' / personalizado)
  // Uso: usado em AddFriends.vue como decoração/ilustração junto à lista
  planeIcon: {
    viewBox: '0 0 20 20',
    paths: [
      {
        d: 'M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z',
      },
    ],
  },
  // backArrow
  // Origem: ícone de seta para voltar (linha simples, estilo outline)
  // Uso: botões de retorno em Login.vue e Signup.vue
  backArrow: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M10 19l-7-7m0 0l7-7m-7 7h18',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  // checkIcon
  // Origem: ícone de check/confirm (estilo simples)
  // Uso: indicadores de regra de senha em Signup.vue e Login.vue
  checkIcon: {
    viewBox: '0 0 12 12',
    paths: [
      {
        d: 'M4 6l2 2 4-4',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  // eyeOpen
  // Origem: ícone de olho aberto (visualização de senha)
  // Uso: botão de mostrar senha em InputLabel.vue e componentes de formulário
  eyeOpen: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      {
        d: 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  // eyeClosed
  // Origem: ícone de olho riscado/fechado (ocultar senha)
  // Uso: botão de esconder senha em InputLabel.vue e componentes de formulário
  eyeClosed: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  // filterIcon
  // Origem: ícone de filtro/deslizadores
  // Uso: botão à direita no campo de busca de Interest.vue
  filterIcon: {
    viewBox: '0 0 20 20',
    paths: [
      { d: 'M3 5h14M5 10h10M8 15h4', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  // plusIcon
  // Origem: ícone de adição
  // Uso: adicionar novo interesse na lista de sugestões de Interest.vue
  plusIcon: {
    viewBox: '0 0 20 20',
    paths: [
      { d: 'M10 4v12M4 10h12', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
}
