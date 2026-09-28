import { describe, expect, it } from 'vitest'
import { pickMutualFollowers } from './mutualFollowers'

const person = (id: string) => ({ id, name: `Pessoa ${id}` })

describe('pickMutualFollowers', () => {
  it('devolve quem segue o perfil E é seguido pelo visitante', () => {
    const result = pickMutualFollowers(
      [person('a'), person('b'), person('c')],
      [person('b'), person('c'), person('z')],
      'viewer',
      'profile',
    )
    expect(result.map(p => p.id)).toEqual(['b', 'c'])
  })

  it('mantém a ordem da lista de seguidores', () => {
    const result = pickMutualFollowers(
      [person('c'), person('b')],
      [person('b'), person('c')],
      'viewer',
      'profile',
    )
    expect(result.map(p => p.id)).toEqual(['c', 'b'])
  })

  it('exclui o próprio visitante (que aparece nos seguidores se já segue o perfil)', () => {
    const result = pickMutualFollowers([person('viewer'), person('b')], [person('viewer'), person('b')], 'viewer', 'profile')
    expect(result.map(p => p.id)).toEqual(['b'])
  })

  it('exclui o dono do perfil', () => {
    const result = pickMutualFollowers([person('profile')], [person('profile')], 'viewer', 'profile')
    expect(result).toEqual([])
  })

  it('compara ids como string (id numérico da API não quebra o cruzamento)', () => {
    const result = pickMutualFollowers([{ id: 1 as unknown as string, name: 'A' }], [{ id: '1', name: 'A' }], 'viewer', 'profile')
    expect(result).toHaveLength(1)
  })

  it('listas vazias não geram nada', () => {
    expect(pickMutualFollowers([], [person('a')], 'viewer', 'profile')).toEqual([])
    expect(pickMutualFollowers([person('a')], [], 'viewer', 'profile')).toEqual([])
  })
})
