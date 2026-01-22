import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toggleLikeEvent } from '@/api/event'

export type EventId = string | number

export interface FeedItem {
  id: EventId
  banner: string
  creator: {
    name: string
  }
  hostAvatar: string
  schedule: string
  location?: string
  title: string
  description: string
  confirmed: number
  interested: number
  likes?: number
}

export const useEventsStore = defineStore('events', () => {
  const savedEvents = ref<FeedItem[]>([])
  const likedEvents = ref<EventId[]>([])

  // Load from local storage on init
  const stored = localStorage.getItem('SAVED_EVENTS')
  if (stored) {
    try {
      savedEvents.value = JSON.parse(stored)
    } catch (error) {
      console.error('Failed to parse saved events', error)
    }
  }

  const likedStored = localStorage.getItem('LIKED_EVENTS')
  if (likedStored) {
    try {
      likedEvents.value = JSON.parse(likedStored)
    } catch (error) {
      console.error('Failed to parse liked events', error)
    }
  }

  function toggleSave (event: FeedItem) {
    const index = savedEvents.value.findIndex(e => e.id === event.id)
    if (index === -1) {
      savedEvents.value.push(event)
    } else {
      savedEvents.value.splice(index, 1)
    }
    localStorage.setItem('SAVED_EVENTS', JSON.stringify(savedEvents.value))
  }

  function isSaved (id: EventId) {
    const normalizedId = String(id)
    return savedEvents.value.some(e => String(e.id) === normalizedId)
  }

  async function toggleLike (id: EventId) {
    const normalizedId = String(id)
    // Optimistic update
    const index = likedEvents.value.findIndex(likedId => String(likedId) === normalizedId)
    const isAdding = index === -1

    if (isAdding) {
      likedEvents.value.push(normalizedId)
    } else {
      likedEvents.value.splice(index, 1)
    }
    localStorage.setItem('LIKED_EVENTS', JSON.stringify(likedEvents.value))

    try {
      await toggleLikeEvent(id)
    } catch (error) {
      // Revert if API fails
      console.error('Failed to toggle like on server', error)
      const revertIndex = likedEvents.value.findIndex(likedId => String(likedId) === normalizedId)
      if (isAdding && revertIndex !== -1) {
        likedEvents.value.splice(revertIndex, 1)
      } else if (!isAdding && revertIndex === -1) {
        likedEvents.value.push(normalizedId)
      }
      localStorage.setItem('LIKED_EVENTS', JSON.stringify(likedEvents.value))
    }
  }

  function isLiked (id: EventId) {
    const normalizedId = String(id)
    return likedEvents.value.some(likedId => String(likedId) === normalizedId)
  }

  return {
    savedEvents,
    toggleSave,
    isSaved,
    likedEvents,
    toggleLike,
    isLiked,
  }
})
