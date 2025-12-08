import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react'
import { VinylRecord } from './components/VinylRecord'
import { ToneArm } from './components/ToneArm'
import { Slider } from './components/ui/slider'
import { projectId, publicAnonKey } from './utils/supabase/info'

interface SpotifyTrack {
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
}

interface SpotifyDevice {
  id: string
  name: string
  type: string
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([50])
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const tokenExpiryRef = useRef<number | null>(null)

  // Load Spotify Web Playback SDK
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify SDK ready')
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Initialize Spotify Player when authenticated
  useEffect(() => {
    if (!accessToken || player) return

    const initPlayer = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Retro Record Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken)
        },
        volume: volume[0] / 100
      })

      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id)
        setDeviceId(device_id)
      })

      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return
        
        setCurrentTrack(state.track_window.current_track)
        setIsPlaying(!state.paused)
      })

      spotifyPlayer.connect()
      setPlayer(spotifyPlayer)
    }

    if (window.Spotify) {
      initPlayer()
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer
    }

    return () => {
      if (player) {
        player.disconnect()
      }
    }
  }, [accessToken])

  // Token refresh logic
  useEffect(() => {
    if (!refreshToken || !tokenExpiryRef.current) return

    const timeUntilExpiry = tokenExpiryRef.current - Date.now() - 60000 // Refresh 1 min before expiry
    
    if (timeUntilExpiry <= 0) {
      refreshAccessToken()
      return
    }

    const timeout = setTimeout(refreshAccessToken, timeUntilExpiry)
    return () => clearTimeout(timeout)
  }, [refreshToken])

  const refreshAccessToken = async () => {
    if (!refreshToken) return

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a350608d/spotify/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()
      
      if (data.accessToken) {
        setAccessToken(data.accessToken)
        tokenExpiryRef.current = Date.now() + (data.expiresIn * 1000)
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    }
  }

  const handleSpotifyLogin = async () => {
    try {
      // First, get the Spotify auth URL from our server
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a350608d/spotify/auth-url`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      
      const { authUrl } = await response.json()
      
      const width = 500
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      const popup = window.open(
        authUrl,
        'Spotify Login',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'spotify-auth') {
          setAccessToken(event.data.accessToken)
          setRefreshToken(event.data.refreshToken)
          tokenExpiryRef.current = Date.now() + (event.data.expiresIn * 1000)
          setIsAuthenticated(true)
          window.removeEventListener('message', messageHandler)
        }
      }

      window.addEventListener('message', messageHandler)
    } catch (error) {
      console.error('Error initiating Spotify login:', error)
    }
  }

  const spotifyApiCall = async (endpoint: string, method = 'GET', body?: any) => {
    if (!accessToken) return null

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a350608d/spotify/api/${endpoint}`,
        {
          method,
          headers: {
            'X-Spotify-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: body ? JSON.stringify(body) : undefined
        }
      )

      return await response.json()
    } catch (error) {
      console.error('Spotify API error:', error)
      return null
    }
  }

  const togglePlayPause = async () => {
    if (!player) return

    player.togglePlay()
  }

  const skipToNext = async () => {
    if (!player) return
    player.nextTrack()
  }

  const skipToPrevious = async () => {
    if (!player) return
    player.previousTrack()
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (player) {
      player.setVolume(value[0] / 100)
    }
  }

  // Fetch user's top tracks when authenticated
  useEffect(() => {
    if (!isAuthenticated || !deviceId) return

    const fetchAndPlayMusic = async () => {
      // Get user's top tracks
      const topTracks = await spotifyApiCall('me/top/tracks?limit=1')
      
      if (topTracks?.items?.[0]) {
        // Start playing on this device
        await spotifyApiCall(`me/player/play?device_id=${deviceId}`, 'PUT', {
          uris: [topTracks.items[0].uri]
        })
      }
    }

    fetchAndPlayMusic()
  }, [isAuthenticated, deviceId])

  if (!isAuthenticated) {
    return (
      <div className="size-full min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl text-amber-900 tracking-tight" style={{ fontFamily: 'serif' }}>
              Retro Player
            </h1>
            <p className="text-xl text-amber-800/80">
              Your vintage vinyl experience
            </p>
          </div>

          <div className="relative inline-block">
            <VinylRecord isPlaying={false} />
          </div>

          <button
            onClick={handleSpotifyLogin}
            className="px-8 py-4 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Connect to Spotify
          </button>

          <p className="text-sm text-amber-700/60">
            Sign in with your Spotify account to start listening
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="size-full min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Record Player Console */}
        <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 rounded-3xl shadow-2xl p-8 md:p-12 border-8 border-amber-950">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl text-amber-100 tracking-wide" style={{ fontFamily: 'serif' }}>
              Retro Player
            </h1>
          </div>

          {/* Vinyl and Tone Arm */}
          <div className="flex justify-center mb-8 relative">
            <div className="relative">
              <VinylRecord 
                albumArt={currentTrack?.album?.images?.[0]?.url}
                isPlaying={isPlaying}
              />
              <ToneArm isPlaying={isPlaying} />
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-8 min-h-24">
            {currentTrack ? (
              <div className="space-y-2">
                <h2 className="text-2xl text-amber-50">
                  {currentTrack.name}
                </h2>
                <p className="text-lg text-amber-200/80">
                  {currentTrack.artists.map(a => a.name).join(', ')}
                </p>
                <p className="text-sm text-amber-300/60">
                  {currentTrack.album.name}
                </p>
              </div>
            ) : (
              <p className="text-amber-200/60 text-lg">
                Ready to play...
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={skipToPrevious}
              className="w-14 h-14 rounded-full bg-amber-700 hover:bg-amber-600 text-amber-100 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" fill="currentColor" />
              ) : (
                <Play className="w-10 h-10 ml-1" fill="currentColor" />
              )}
            </button>

            <button
              onClick={skipToNext}
              className="w-14 h-14 rounded-full bg-amber-700 hover:bg-amber-600 text-amber-100 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="max-w-xs mx-auto">
            <div className="flex items-center gap-4 bg-amber-950/30 rounded-full px-6 py-4">
              <Volume2 className="w-5 h-5 text-amber-300" />
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}