/**
 * Conteúdo da página de Novidades (/public/updates).
 *
 * Fonte única de verdade das atualizações exibidas ao público. O conteúdo é
 * versionado junto do código: para publicar uma novidade, adicione um item
 * aqui e faça o deploy — não há CMS nem endpoint por trás.
 *
 * Regras de negócio aplicadas pela página (ver NewsUpdates.vue):
 * - Entregas concluídas aparecem da mais recente para a mais antiga.
 * - Itens `upcoming` só são exibidos se tiverem `expectedAt` preenchido.
 */

/** Natureza da atualização — define o rótulo e a cor do card. */
export type NewsUpdateCategory = 'feature' | 'improvement' | 'fix'

interface BaseNewsUpdate {
  /** Identificador estável; usado como key de lista e âncora de link. */
  id: string
  title: string
  description: string
  category: NewsUpdateCategory
  /** Bullets opcionais detalhando o que mudou. */
  highlights?: string[]
}

/**
 * Uma atualização já entregue. `releasedAt` é obrigatório: sem data de
 * implementação o item não teria como ser ordenado no histórico.
 */
export interface ReleasedNewsUpdate extends BaseNewsUpdate {
  status: 'released'
  /** Data de implementação, ISO `YYYY-MM-DD`. */
  releasedAt: string
}

/**
 * Uma atualização planejada. `expectedAt` é opcional no tipo porque o produto
 * pode registrar algo sem data ainda — a página filtra esses itens.
 */
export interface UpcomingNewsUpdate extends BaseNewsUpdate {
  status: 'upcoming'
  /** Previsão de lançamento, ISO `YYYY-MM-DD`. Sem ela o item não é exibido. */
  expectedAt?: string
}

export type NewsUpdate = ReleasedNewsUpdate | UpcomingNewsUpdate

/** Rótulo e cor por categoria, alinhados à identidade visual da landing. */
export const NEWS_CATEGORY_META: Record<NewsUpdateCategory, { label: string, icon: string, color: string }> = {
  feature: { label: 'Novidade', icon: 'mdi-star-four-points', color: '#FFB74D' },
  improvement: { label: 'Melhoria', icon: 'mdi-trending-up', color: '#8b5cf6' },
  fix: { label: 'Correção', icon: 'mdi-wrench', color: '#3b82f6' },
}

/** Quantas entregas recentes ficam em destaque antes do histórico compacto. */
export const LATEST_UPDATES_COUNT = 3

export const NEWS_UPDATES: NewsUpdate[] = [
  {
    id: 'inline-comments',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-07-16',
    title: 'Comentários direto no feed',
    description: 'Comente e responda sem sair do feed, acompanhando a conversa em tempo real.',
    highlights: ['Respostas aninhadas', 'Contador de comentários por evento'],
  },
  {
    id: 'event-details-revamp',
    status: 'released',
    category: 'improvement',
    releasedAt: '2026-07-15',
    title: 'Página de evento reformulada',
    description: 'Detalhes do evento com informações completas, mapa integrado e lista de participantes.',
  },
  {
    id: 'auth-hardening',
    status: 'released',
    category: 'improvement',
    releasedAt: '2026-07-14',
    title: 'Login mais rápido e confiável',
    description: 'Padronizamos as respostas da API e melhoramos as mensagens de erro em todo o fluxo de entrada.',
    highlights: ['Mensagens de erro mais claras', 'Respostas da API normalizadas'],
  },
  {
    id: 'performance-rate-limiting',
    status: 'released',
    category: 'improvement',
    releasedAt: '2026-07-14',
    title: 'Plataforma mais estável sob carga',
    description: 'Requisições agora têm limite de taxa e cancelamento automático, deixando a navegação mais fluida.',
  },
  {
    id: 'mobile-menu',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-07-06',
    title: 'Menu mobile e perfil repaginado',
    description: 'Navegação por gaveta no celular e um layout de perfil pensado para telas pequenas.',
  },
  {
    id: 'pwa-install',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-07-03',
    title: 'Instale a We Party como app',
    description: 'Adicione a We Party à tela de início e use como um aplicativo nativo, inclusive no iOS.',
  },
  {
    id: 'geolocation',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-06-09',
    title: 'Eventos perto de você',
    description: 'Usamos sua localização para priorizar os eventos mais próximos no feed.',
  },
  {
    id: 'guest-mode',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-06-02',
    title: 'Explore sem criar conta',
    description: 'Navegue pelo feed como visitante e crie sua conta só quando quiser interagir.',
  },
  {
    id: 'push-notifications',
    status: 'upcoming',
    category: 'feature',
    expectedAt: '2026-08-15',
    title: 'Notificações de eventos',
    description: 'Avisos quando um amigo confirmar presença ou um evento que você segue for atualizado.',
  },
  {
    id: 'event-chat',
    status: 'upcoming',
    category: 'feature',
    expectedAt: '2026-09-30',
    title: 'Chat por evento',
    description: 'Um espaço de conversa para quem vai ao mesmo evento se organizar antes da festa.',
  },
]
