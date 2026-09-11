import { describe, expect, it } from 'vitest'
import { AVATAR_GRADIENTS, getAvatarGradient, getInitials, resolveAvatarImage } from './avatar'

// Teste de fumaça da Fase 0 (REFACTOR_AUDIT_PLAN.md): valida que o pipeline
// Vitest + jsdom + alias `@` está funcionando de ponta a ponta. Cobertura
// completa dos composables/stores é assunto da Fase 4, não desta.
describe('getInitials', () => {
  it('retorna "?" para nome vazio', () => {
    expect(getInitials('')).toBe('?')
  })

  it('retorna a inicial única para nome de uma palavra', () => {
    expect(getInitials('Maria')).toBe('M')
  })

  it('retorna as duas iniciais para nome com sobrenome', () => {
    expect(getInitials('Maria Silva')).toBe('MS')
  })
})

describe('getAvatarGradient', () => {
  it('retorna o primeiro gradiente quando o seed é vazio', () => {
    expect(getAvatarGradient('')).toBe(AVATAR_GRADIENTS[0])
  })

  it('é estável entre chamadas para o mesmo seed', () => {
    expect(getAvatarGradient('usuario-123')).toBe(getAvatarGradient('usuario-123'))
  })
})

describe('resolveAvatarImage', () => {
  it('retorna vazio quando não há valor', () => {
    expect(resolveAvatarImage(undefined)).toBe('')
  })

  it('mantém URLs absolutas intactas', () => {
    expect(resolveAvatarImage('https://cdn.example.com/foto.png')).toBe('https://cdn.example.com/foto.png')
  })
})
