// Tipos compartilhados entre Profile.vue e os subcomponentes de modal
// extraídos na Fase 5 (REFACTOR_AUDIT_PLAN.md).
export interface FollowUser {
  id: string | number
  name: string
  username?: string
  profileImage?: string
  isFollowing?: boolean
}
