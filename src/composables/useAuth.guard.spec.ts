import { beforeEach, describe, expect, it, vi } from 'vitest'
import { privateRouteGuard } from './useAuth'

const { authState } = vi.hoisted(() => ({
  authState: {
    authenticated: false,
    user: null as null | { isEmailVerified?: boolean },
  },
}))

vi.mock('@/services/auth', () => ({
  AuthService: {
    isAuthenticated: () => authState.authenticated,
    getUser: () => authState.user,
    // Lidos no carregamento do módulo (estado global do useAuth).
    getToken: () => null,
    getSafeUserData: () => null,
    getMaskedEmail: () => '',
  },
}))

describe('privateRouteGuard — redirect de login com ?next= (WEPARTY-239)', () => {
  beforeEach(() => {
    authState.authenticated = false
    authState.user = null
  })

  it('deslogado em evento com ref vai para /login?next= preservando o ref', () => {
    const result = privateRouteGuard('/event/ev1', '/event/ev1?ref=abcd2345')

    expect(result).toBe('/login?next=%2Fevent%2Fev1%3Fref%3Dabcd2345')
    const next = new URLSearchParams(String(result).split('?')[1]).get('next')
    expect(next).toBe('/event/ev1?ref=abcd2345')
  })

  it('sem fullPath mantém o /login de antes', () => {
    expect(privateRouteGuard('/event/ev1')).toBe('/login')
  })

  it('feed privado deslogado continua indo para /explore', () => {
    expect(privateRouteGuard('/feed', '/feed')).toBe('/explore')
  })

  it('logado com e-mail verificado passa', () => {
    authState.authenticated = true
    authState.user = { isEmailVerified: true }

    expect(privateRouteGuard('/event/ev1', '/event/ev1?ref=abcd2345')).toBe(true)
  })

  it('logado sem e-mail verificado vai para /confirm-email', () => {
    authState.authenticated = true
    authState.user = { isEmailVerified: false }

    expect(privateRouteGuard('/event/ev1', '/event/ev1')).toBe('/confirm-email')
  })
})
