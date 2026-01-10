import { defineStore } from 'pinia'
import { ref } from 'vue'

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
    return savedEvents.value.some(e => e.id === id)
  }

  function toggleLike (id: EventId) {
    const index = likedEvents.value.indexOf(id)
    if (index === -1) {
      likedEvents.value.push(id)
    } else {
      likedEvents.value.splice(index, 1)
    }
    localStorage.setItem('LIKED_EVENTS', JSON.stringify(likedEvents.value))
  }

  function isLiked (id: EventId) {
    return likedEvents.value.includes(id)
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
