import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

describe('useInterestNavigation', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('navega para /interests/:slugOrId', async () => {
    const { useInterestNavigation } = await import('./useInterestNavigation')
    const { goToInterest } = useInterestNavigation()

    goToInterest('techno')
    expect(push).toHaveBeenCalledWith('/interests/techno')

    goToInterest('abc-uuid-123')
    expect(push).toHaveBeenCalledWith('/interests/abc-uuid-123')
  })

  it('ignora valor vazio', async () => {
    const { useInterestNavigation } = await import('./useInterestNavigation')
    const { goToInterest } = useInterestNavigation()

    goToInterest(null)
    goToInterest(undefined)
    goToInterest('')
    expect(push).not.toHaveBeenCalled()
  })
})
