// Spotify Web Playback SDK type declarations
interface Window {
  onSpotifyWebPlaybackSDKReady: () => void
  Spotify: typeof Spotify
}

declare namespace Spotify {
  interface Player {
    new (options: PlayerOptions): PlayerInstance
  }

  interface PlayerOptions {
    name: string
    getOAuthToken: (callback: (token: string) => void) => void
    volume?: number
  }

  interface PlayerInstance {
    connect(): Promise<boolean>
    disconnect(): void
    addListener(
      event: 'ready',
      callback: (data: { device_id: string }) => void
    ): void
    addListener(
      event: 'player_state_changed',
      callback: (state: PlayerState | null) => void
    ): void
    togglePlay(): Promise<void>
    nextTrack(): Promise<void>
    previousTrack(): Promise<void>
    setVolume(volume: number): Promise<void>
  }

  interface PlayerState {
    paused: boolean
    track_window: {
      current_track: SpotifyTrack
    }
  }

  interface SpotifyTrack {
    name: string
    artists: { name: string }[]
    album: {
      name: string
      images: { url: string }[]
    }
    duration_ms: number
  }
}
