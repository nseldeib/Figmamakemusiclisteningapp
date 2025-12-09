import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/spotify/callback`

  if (!code) {
    return new NextResponse(
      '<html><body><script>window.close()</script><p>Error: No code received</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    })

    const data = await response.json()

    if (data.error) {
      return new NextResponse(
        '<html><body><script>window.close()</script><p>Error authenticating with Spotify</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    return new NextResponse(
      `<html>
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
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('Spotify callback error:', error)
    return new NextResponse(
      '<html><body><script>window.close()</script><p>Error during authentication</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}
