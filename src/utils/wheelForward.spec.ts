import { describe, expect, it } from 'vitest'
import { shouldForwardWheel } from './wheelForward'

describe('shouldForwardWheel', () => {
  it('repassa o wheel pro feed quando a coluna não tem o que rolar', () => {
    expect(shouldForwardWheel({ scrollHeight: 400, clientHeight: 400 }, 120)).toBe(true)
    expect(shouldForwardWheel({ scrollHeight: 400, clientHeight: 400 }, -120)).toBe(true)
  })

  it('tolera 1px de arredondamento do navegador', () => {
    expect(shouldForwardWheel({ scrollHeight: 401, clientHeight: 400 }, 120)).toBe(true)
  })

  it('não repassa quando a coluna rola, nem no começo nem no fim dela', () => {
    expect(shouldForwardWheel({ scrollHeight: 900, clientHeight: 400 }, 120)).toBe(false)
    expect(shouldForwardWheel({ scrollHeight: 900, clientHeight: 400 }, -120)).toBe(false)
  })

  it('ignora wheel sem deslocamento vertical', () => {
    expect(shouldForwardWheel({ scrollHeight: 400, clientHeight: 400 }, 0)).toBe(false)
  })
})
