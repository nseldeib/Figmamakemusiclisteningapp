import { NextRequest, NextResponse } from 'next/server'

async function handleSpotifyApi(
  request: NextRequest,
  params: { path: string[] }
) {
  const path = params.path.join('/')
  const accessToken = request.headers.get('X-Spotify-Token')

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 })
  }

  try {
    const url = `https://api.spotify.com/v1/${path}`
    const searchParams = request.nextUrl.searchParams.toString()
    const fullUrl = searchParams ? `${url}?${searchParams}` : url
    const method = request.method
    const body = method !== 'GET' ? await request.text() : undefined

    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body
    })

    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error proxying Spotify API:', error)
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleSpotifyApi(req, resolvedParams)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleSpotifyApi(req, resolvedParams)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleSpotifyApi(req, resolvedParams)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleSpotifyApi(req, resolvedParams)
}
