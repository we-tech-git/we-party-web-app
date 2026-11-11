import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getEventById } from './event'

const { callApiMock } = vi.hoisted(() => ({
  callApiMock: vi.fn().mockResolvedValue({ data: { id: 'ev1' } }),
}))

vi.mock('.', () => ({ callApi: callApiMock }))

describe('getEventById (WEPARTY-239)', () => {
  beforeEach(() => {
    callApiMock.mockClear()
  })

  it('sem ref: chama GET /events/:id sem query', async () => {
    await getEventById('ev1')

    expect(callApiMock).toHaveBeenCalledWith('GET', '/events/ev1', {}, true)
  })

  it('com ref: repassa o código como ?ref=', async () => {
    await getEventById('ev1', 'abcd2345')

    expect(callApiMock).toHaveBeenCalledWith('GET', '/events/ev1?ref=abcd2345', {}, true)
  })

  it('codifica o ref na URL', async () => {
    await getEventById('ev1', 'a b&x=1')

    expect(callApiMock).toHaveBeenCalledWith('GET', '/events/ev1?ref=a%20b%26x%3D1', {}, true)
  })

  it('ref vazio é tratado como ausente', async () => {
    await getEventById('ev1', '')

    expect(callApiMock).toHaveBeenCalledWith('GET', '/events/ev1', {}, true)
  })
})
