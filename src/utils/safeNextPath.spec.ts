import { describe, expect, it } from 'vitest'
import { getSafeNextPath, loginPathWithNext } from './safeNextPath'

describe('getSafeNextPath', () => {
  it.each([
    '/event/ev1?ref=abcd2345',
    '/feed',
    '/profile/u1#bio',
  ])('aceita caminho relativo da própria app (%s)', next => {
    expect(getSafeNextPath(next)).toBe(next)
  })

  it.each([
    undefined,
    null,
    '',
    ['/feed'],
    'https://evil.example',
    '//evil.example/x',
    String.raw`/\evil.example`,
    'javascript:alert(1)',
    '/login',
    '/login?next=/feed',
  ])('rejeita destino fora da app ou de volta ao login (%s)', next => {
    expect(getSafeNextPath(next)).toBeNull()
  })
})

describe('loginPathWithNext', () => {
  it('guarda o caminho completo, com ref, codificado em ?next=', () => {
    expect(loginPathWithNext('/event/ev1?ref=abcd2345'))
      .toBe('/login?next=%2Fevent%2Fev1%3Fref%3Dabcd2345')
  })

  it('sem caminho válido vai para /login puro', () => {
    expect(loginPathWithNext()).toBe('/login')
    expect(loginPathWithNext('//evil.example')).toBe('/login')
  })
})
