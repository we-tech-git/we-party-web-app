// Tipos compartilhados entre LandingPage.vue e os subcomponentes de seção
// extraídos na Fase 5 (REFACTOR_AUDIT_PLAN.md). `DiscoverEventCard` mora
// aqui porque não é exclusivo da seção "discover" — a seção "app-showcase"
// (ainda não extraída) também lê `discoverEvents[0]` pro preview do celular.
export interface DiscoverEventCard {
  emoji: string
  category: string
  tag: string
  tagColor: string
  title: string
  likes: number
  comments: number
  when: string
  gradient: string
  image: string
}
