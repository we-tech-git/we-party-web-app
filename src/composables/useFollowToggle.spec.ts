import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { followUserById, unfollowUserById } from '@/api/follows'
import { useFollowToggle } from './useFollowToggle'

vi.mock('@/api/follows', () => ({
  followUserById: vi.fn(),
  unfollowUserById: vi.fn(),
}))

interface Person { id: string, isFollowing?: boolean }

function setup (options: { onSuccess?: () => void, onError?: () => void } = {}) {
  // A mesma pessoa em duas listas, cada uma com seu próprio objeto.
  const followers = ref<Person[]>([{ id: '1', isFollowing: false }])
  const recommended = ref<Person[]>([{ id: '1', isFollowing: false }, { id: '2', isFollowing: true }])
  const { toggleFollow } = useFollowToggle<Person>({ lists: [followers, recommended], ...options })
  return { followers, recommended, toggleFollow }
}

describe('useFollowToggle', () => {
  beforeEach(() => {
    vi.mocked(followUserById).mockReset().mockResolvedValue(undefined as never)
    vi.mocked(unfollowUserById).mockReset().mockResolvedValue(undefined as never)
  })

  it('segue e reflete o estado em todas as listas com a mesma pessoa', async () => {
    const onSuccess = vi.fn()
    const { followers, recommended, toggleFollow } = setup({ onSuccess })

    await toggleFollow(followers.value[0]!)

    expect(followUserById).toHaveBeenCalledWith('1')
    expect(followers.value[0]!.isFollowing).toBe(true)
    expect(recommended.value[0]!.isFollowing).toBe(true)
    expect(recommended.value[1]!.isFollowing).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(followers.value[0], true)
  })

  it('deixa de seguir quando já seguia', async () => {
    const { recommended, toggleFollow } = setup()

    await toggleFollow(recommended.value[1]!)

    expect(unfollowUserById).toHaveBeenCalledWith('2')
    expect(recommended.value[1]!.isFollowing).toBe(false)
  })

  it('reverte em todas as listas e avisa quando a API falha', async () => {
    vi.mocked(followUserById).mockRejectedValue(new Error('boom'))
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const { followers, recommended, toggleFollow } = setup({ onSuccess, onError })

    await toggleFollow(followers.value[0]!)

    expect(followers.value[0]!.isFollowing).toBe(false)
    expect(recommended.value[0]!.isFollowing).toBe(false)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
  })

  it('ignora o segundo clique enquanto o primeiro está pendente', async () => {
    let resolve!: () => void
    vi.mocked(followUserById).mockReturnValue(new Promise<never>(r => {
      resolve = () => r(undefined as never)
    }))
    const { followers, toggleFollow } = setup()

    const first = toggleFollow(followers.value[0]!)
    await toggleFollow(followers.value[0]!)
    resolve()
    await first

    expect(followUserById).toHaveBeenCalledOnce()
    expect(followers.value[0]!.isFollowing).toBe(true)
  })

  it('libera a pessoa depois de terminar (permite seguir de novo)', async () => {
    const { followers, toggleFollow } = setup()

    await toggleFollow(followers.value[0]!)
    await toggleFollow(followers.value[0]!)

    expect(followUserById).toHaveBeenCalledOnce()
    expect(unfollowUserById).toHaveBeenCalledOnce()
    expect(followers.value[0]!.isFollowing).toBe(false)
  })
})
