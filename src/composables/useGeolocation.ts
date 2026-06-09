import { ref } from 'vue'

interface Coords {
  lat: number
  lng: number
}

// Fallback: São Paulo (usado quando o usuário nega ou o navegador não suporta geolocalização)
const FALLBACK: Coords = { lat: -23.5505, lng: -46.6333 }
const SESSION_KEY = 'wp_geo_coords'
const SESSION_DENIED_KEY = 'wp_geo_denied'

export function useGeolocation () {
  const locationDenied = ref(false)

  async function getCoords (): Promise<Coords> {
    // Já negou nessa sessão — não pede de novo
    if (sessionStorage.getItem(SESSION_DENIED_KEY)) {
      locationDenied.value = true
      return FALLBACK
    }

    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      try {
        return JSON.parse(cached) as Coords
      } catch {
        sessionStorage.removeItem(SESSION_KEY)
      }
    }

    if (!navigator.geolocation) {
      return FALLBACK
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(coords))
          resolve(coords)
        },
        () => {
          locationDenied.value = true
          sessionStorage.setItem(SESSION_DENIED_KEY, '1')
          resolve(FALLBACK)
        },
        { timeout: 10_000, maximumAge: 0 },
      )
    })
  }

  return { getCoords, locationDenied }
}
