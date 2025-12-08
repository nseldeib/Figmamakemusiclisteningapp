import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

// Get Spotify auth URL
app.get('/make-server-a350608d/spotify/auth-url', (c) => {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-a350608d/spotify/callback`
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-top-read'
  ].join(' ')

  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}`

  return c.json({ authUrl })
})

// Spotify OAuth flow - redirect to Spotify for authentication
app.get('/make-server-a350608d/spotify/login', (c) => {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-a350608d/spotify/callback`
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-top-read'
  ].join(' ')

  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}`

  return c.redirect(authUrl)
})

// Spotify OAuth callback - exchange code for access token
app.get('/make-server-a350608d/spotify/callback', async (c) => {
  const code = c.req.query('code')
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-a350608d/spotify/callback`

  if (!code) {
    console.log('Spotify callback error: No authorization code received')
    return c.html('<html><body><script>window.close()</script><p>Error: No code received</p></body></html>')
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    })

    const data = await response.json()

    if (data.error) {
      console.log(`Spotify token exchange error: ${data.error} - ${data.error_description}`)
      return c.html('<html><body><script>window.close()</script><p>Error authenticating with Spotify</p></body></html>')
    }

    // Send tokens back to parent window and close popup
    return c.html(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'spotify-auth',
              accessToken: '${data.access_token}',
              refreshToken: '${data.refresh_token}',
              expiresIn: ${data.expires_in}
            }, '*');
            window.close();
          </script>
          <p>Authentication successful! You can close this window.</p>
        </body>
      </html>
    `)
  } catch (error) {
    console.log(`Spotify callback error during token exchange: ${error}`)
    return c.html('<html><body><script>window.close()</script><p>Error during authentication</p></body></html>')
  }
})

// Refresh Spotify access token
app.post('/make-server-a350608d/spotify/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json()
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    const data = await response.json()

    if (data.error) {
      console.log(`Spotify token refresh error: ${data.error}`)
      return c.json({ error: data.error }, 400)
    }

    return c.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in
    })
  } catch (error) {
    console.log(`Error refreshing Spotify token: ${error}`)
    return c.json({ error: 'Failed to refresh token' }, 500)
  }
})

// Proxy Spotify API requests
app.all('/make-server-a350608d/spotify/api/*', async (c) => {
  const path = c.req.path.replace('/make-server-a350608d/spotify/api/', '')
  const accessToken = c.req.header('X-Spotify-Token')

  if (!accessToken) {
    console.log('Spotify API proxy error: No access token provided')
    return c.json({ error: 'No access token' }, 401)
  }

  try {
    const url = `https://api.spotify.com/v1/${path}`
    const method = c.req.method
    const body = method !== 'GET' ? await c.req.text() : undefined

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body
    })

    const data = await response.text()
    
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.log(`Error proxying Spotify API request to ${path}: ${error}`)
    return c.json({ error: 'Failed to proxy request' }, 500)
  }
})

Deno.serve(app.fetch)