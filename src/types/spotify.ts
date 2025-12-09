export interface SpotifyTrack {
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
}

export interface SpotifyDevice {
  id: string
  name: string
  type: string
}
