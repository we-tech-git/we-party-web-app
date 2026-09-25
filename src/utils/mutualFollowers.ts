export interface FollowPerson {
  id: string
  name: string
  username?: string
  profileImage?: string | null
}

/**
 * "Seguido por quem você segue": seguidores do perfil visitado que o
 * visitante também segue.
 *
 * O backend não tem endpoint de seguidores em comum, então o cruzamento é
 * feito aqui com as duas listas que a API já entrega (seguidores do perfil e
 * quem o visitante segue). O visitante e o dono do perfil ficam de fora: um
 * não é "comum" a si mesmo. A ordem dos seguidores (mais recente primeiro) é
 * mantida.
 */
export function pickMutualFollowers (
  followers: FollowPerson[],
  viewerFollowing: FollowPerson[],
  viewerId: string,
  profileId: string,
): FollowPerson[] {
  const followedByViewer = new Set(viewerFollowing.map(person => String(person.id)))

  return followers.filter(person => {
    const id = String(person.id)
    return id !== String(viewerId) && id !== String(profileId) && followedByViewer.has(id)
  })
}
