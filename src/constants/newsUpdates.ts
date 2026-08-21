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
  /** Tag ou escopo temático da novidade (ex.: 'Social & Feed', 'Mobile & App') */
  tag?: string
  /** Badge promocional ou de status (ex.: 'DESTAQUE', 'NOVO') */
  badge?: string
  /** Versão ou marco associado (ex.: 'v1.4') */
  version?: string
  /** Rótulo do botão de ação contextual */
  actionLabel?: string
  /** Rota de destino da ação */
  actionPath?: string
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
export const NEWS_CATEGORY_META: Record<NewsUpdateCategory, { label: string, icon: string, color: string, bgSoft: string, borderSoft: string }> = {
  feature: {
    label: 'Novidade',
    icon: 'mdi-star-four-points',
    color: '#FF5F8F',
    bgSoft: 'rgba(255, 95, 143, 0.1)',
    borderSoft: 'rgba(255, 95, 143, 0.25)',
  },
  improvement: {
    label: 'Melhoria',
    icon: 'mdi-trending-up',
    color: '#8B5CF6',
    bgSoft: 'rgba(139, 92, 246, 0.1)',
    borderSoft: 'rgba(139, 92, 246, 0.25)',
  },
  fix: {
    label: 'Correção',
    icon: 'mdi-shield-check-outline',
    color: '#3B82F6',
    bgSoft: 'rgba(59, 130, 246, 0.1)',
    borderSoft: 'rgba(59, 130, 246, 0.25)',
  },
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
    description: 'Comente e responda sem sair do feed, acompanhando a conversa da festa em tempo real.',
    tag: 'Social & Feed',
    badge: 'DESTAQUE',
    version: 'v1.6',
    actionLabel: 'Ver no feed',
    actionPath: '/public/explore',
    highlights: ['Respostas aninhadas e menções', 'Contador de comentários por evento em tempo real', 'Reações com emojis'],
  },
  {
    id: 'event-details-revamp',
    status: 'released',
    category: 'improvement',
    releasedAt: '2026-07-15',
    title: 'Página de evento reformulada',
    description: 'Detalhes do evento com informações completas, mapa integrado e lista visual de participantes confirmados.',
    tag: 'Experiência & Visual',
    version: 'v1.5.2',
    actionLabel: 'Explorar eventos',
    actionPath: '/public/explore',
    highlights: ['Localização no mapa interativo', 'Lista de quem vai na festa', 'Compartilhamento em 1 clique'],
  },
  {
    id: 'auth-hardening',
    status: 'released',
    category: 'improvement',
    releasedAt: '2026-07-14',
    title: 'Login mais rápido e confiável',
    description: 'Padronizamos as respostas da API e melhoramos as mensagens de erro em todo o fluxo de entrada.',
    tag: 'Segurança & Acesso',
    version: 'v1.5.1',
    highlights: ['Mensagens de erro mais claras', 'Respostas da API normalizadas', 'Sessão com persistência estável'],
  },
  {
    id: 'performance-rate-limiting',
    status: 'released',
    category: 'improvement',
    releasedAt: '2026-07-14',
    title: 'Plataforma mais estável sob carga',
    description: 'Requisições agora têm limite de taxa e cancelamento automático, deixando a navegação mais fluida.',
    tag: 'Performance & Infra',
    version: 'v1.5.0',
    highlights: ['Cancelamento de requests duplicadas', 'Carregamento ágil em redes lentas'],
  },
  {
    id: 'mobile-menu',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-07-06',
    title: 'Menu mobile e perfil repaginado',
    description: 'Navegação por gaveta no celular e um layout de perfil pensado para telas pequenas.',
    tag: 'Mobile & Perfil',
    version: 'v1.4.0',
    actionLabel: 'Ver perfil',
    highlights: ['Gaveta lateral animada', 'Atalhos para eventos salvos', 'Layout touch-first'],
  },
  {
    id: 'pwa-install',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-07-03',
    title: 'Instale a We Party como app',
    description: 'Adicione a We Party à tela de início e use como um aplicativo nativo, inclusive no iOS.',
    tag: 'App & PWA',
    badge: 'APP',
    version: 'v1.3.0',
    actionLabel: 'Como instalar',
    highlights: ['Acesso rápido da tela inicial', 'Modo tela cheia sem barras de navegador', 'Suporte a Android e iOS'],
  },
  {
    id: 'geolocation',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-06-09',
    title: 'Eventos perto de você',
    description: 'Usamos sua localização para priorizar os eventos mais próximos no feed e mapa.',
    tag: 'Descoberta Local',
    version: 'v1.2.0',
    actionLabel: 'Explorar perto',
    actionPath: '/public/explore',
    highlights: ['Ordenação por distância', 'Filtro por raio de km', 'Sugestões no seu bairro'],
  },
  {
    id: 'guest-mode',
    status: 'released',
    category: 'feature',
    releasedAt: '2026-06-02',
    title: 'Explore sem criar conta',
    description: 'Navegue pelo feed como visitante e crie sua conta só quando quiser interagir e confirmar presença.',
    tag: 'Acesso Rápido',
    version: 'v1.1.0',
    actionLabel: 'Explorar agora',
    actionPath: '/public/explore',
    highlights: ['Feed público desbloqueado', 'Visualização de eventos sem cadastro prévio'],
  },
  {
    id: 'push-notifications',
    status: 'upcoming',
    category: 'feature',
    expectedAt: '2026-08-15',
    title: 'Notificações de eventos',
    description: 'Avisos quando um amigo confirmar presença ou um evento que você segue for atualizado.',
    tag: 'Social & Alertas',
    highlights: ['Alertas em tempo real de amigos', 'Lembretes de horário de início de eventos'],
  },
  {
    id: 'event-chat',
    status: 'upcoming',
    category: 'feature',
    expectedAt: '2026-09-30',
    title: 'Chat por evento',
    description: 'Um espaço de conversa para quem vai ao mesmo evento se organizar antes da festa.',
    tag: 'Comunidade & Chat',
    highlights: ['Salas temporárias por festa', 'Organização de caronas e esquentas'],
  },
]
