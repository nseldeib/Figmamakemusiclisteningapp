# Retro Record Player - Spotify Web App

A beautiful vintage vinyl record player interface that connects to Spotify's API to provide a nostalgic music listening experience. Features animated spinning vinyl records, realistic tone arm animations, and full playback controls.

![Retro Record Player](https://ribbon-dried-99863478.figma.site)

## Features

- 🎵 **Authentic Vinyl Experience** - Animated spinning vinyl record with album artwork
- 🎚️ **Realistic Tone Arm** - Animated tone arm that moves when music plays
- 🎨 **Warm Retro Design** - Nostalgic color palette with amber and brown tones
- 🎧 **Full Spotify Integration** - Real playback using Spotify Web Playback SDK
- 🎛️ **Playback Controls** - Play/pause, skip forward/back, and volume control
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔐 **OAuth Authentication** - Secure Spotify login flow

## Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Motion (Framer Motion)** - Animations
- **Spotify Web Playback SDK** - Music playback
- **Lucide React** - Icons

### Backend
- **Supabase Edge Functions** - Serverless backend
- **Hono** - Web framework for Deno
- **Spotify Web API** - Music data and control

## Project Structure

```
/
├── App.tsx                           # Main application component
├── components/
│   ├── VinylRecord.tsx              # Animated vinyl record component
│   ├── ToneArm.tsx                  # Animated tone arm component
│   └── ui/
│       └── slider.tsx               # Volume slider component (pre-existing)
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx            # Hono server with Spotify endpoints
│           └── kv_store.tsx         # Key-value storage utility (protected)
├── utils/
│   └── supabase/
│       └── info.tsx                 # Supabase configuration (auto-generated)
└── styles/
    └── globals.css                  # Global styles and typography
```

## Setup Instructions

### 1. Spotify Developer App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the details:
   - **App Name**: Retro Record Player (or your choice)
   - **App Description**: Vintage vinyl music player
   - **Redirect URI**: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/make-server-a350608d/spotify/callback`
     - Replace `YOUR_SUPABASE_PROJECT` with your actual Supabase project ID
   - **APIs Used**: Web Playback SDK, Web API
4. Click "Save"
5. Note your **Client ID** and **Client Secret** (click "View client secret")

### 2. Environment Variables

The following environment variables need to be configured in Supabase:

```bash
# Spotify Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Supabase Credentials (auto-configured in Figma Make)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=your_supabase_db_url
```

### 3. Spotify OAuth Scopes

The app requests the following Spotify scopes:
- `user-read-playback-state` - Read current playback state
- `user-modify-playback-state` - Control playback
- `user-read-currently-playing` - Read currently playing track
- `streaming` - Play music in the browser
- `user-read-email` - Access user email
- `user-read-private` - Access user profile
- `user-top-read` - Read user's top tracks

### 4. Deployment

#### Using Figma Make (Current Setup)
This project is already deployed on Figma Make with Supabase integration.

#### Manual Deployment to Supabase

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**:
   ```bash
   supabase init
   ```

3. **Deploy Edge Function**:
   ```bash
   supabase functions deploy make-server-a350608d
   ```

4. **Set Environment Variables**:
   ```bash
   supabase secrets set SPOTIFY_CLIENT_ID=your_client_id
   supabase secrets set SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

5. **Deploy Frontend**:
   - Build your React app
   - Deploy to your hosting platform of choice (Vercel, Netlify, etc.)
   - Update Spotify redirect URI to match your deployment

## API Endpoints

### Backend (Supabase Edge Functions)

#### `GET /make-server-a350608d/spotify/auth-url`
Returns the Spotify authorization URL for OAuth flow.

**Headers**:
- `Authorization: Bearer {SUPABASE_ANON_KEY}`

**Response**:
```json
{
  "authUrl": "https://accounts.spotify.com/authorize?..."
}
```

#### `GET /make-server-a350608d/spotify/callback`
OAuth callback endpoint that exchanges authorization code for access token.

**Query Parameters**:
- `code`: Authorization code from Spotify

**Response**: HTML page that sends tokens to parent window via postMessage

#### `POST /make-server-a350608d/spotify/refresh`
Refreshes an expired Spotify access token.

**Headers**:
- `Authorization: Bearer {SUPABASE_ANON_KEY}`

**Body**:
```json
{
  "refreshToken": "refresh_token_string"
}
```

**Response**:
```json
{
  "accessToken": "new_access_token",
  "expiresIn": 3600
}
```

#### `ALL /make-server-a350608d/spotify/api/*`
Proxies requests to Spotify Web API.

**Headers**:
- `X-Spotify-Token`: User's Spotify access token
- `Content-Type`: application/json

**Example**:
```
GET /make-server-a350608d/spotify/api/me/top/tracks?limit=1
```

## File Contents

### `/App.tsx`
Main application component that handles:
- Spotify authentication flow
- Web Playback SDK initialization
- Player state management
- UI rendering

### `/components/VinylRecord.tsx`
Animated vinyl record component:
- Rotating animation when playing
- Album artwork display on center label
- Groove effects and vinyl shine

### `/components/ToneArm.tsx`
Animated tone arm component:
- Rotates into position when playing
- Realistic arm and needle design

### `/supabase/functions/server/index.tsx`
Hono-based Edge Function server:
- Spotify OAuth flow
- Token management
- API proxy for Spotify requests

## How It Works

### Authentication Flow

1. User clicks "Connect to Spotify"
2. Frontend requests auth URL from backend
3. Popup opens to Spotify login
4. User authorizes the app
5. Spotify redirects to callback endpoint
6. Backend exchanges code for access token
7. Tokens sent to frontend via postMessage
8. Popup closes, user is authenticated

### Playback Flow

1. Spotify Web Playback SDK initializes
2. Frontend receives device ID
3. App fetches user's top tracks
4. Starts playback on the web player
5. Player state updates trigger UI changes
6. Vinyl spins, tone arm moves, track info displays

### Token Refresh

- Access tokens expire after 1 hour
- Frontend tracks expiry time
- Automatically refreshes 1 minute before expiry
- Uses refresh token to get new access token

## Development Notes

### Protected Files
Do not modify these files:
- `/supabase/functions/server/kv_store.tsx`
- `/utils/supabase/info.tsx`
- `/components/figma/ImageWithFallback.tsx`

### Key Dependencies
```json
{
  "react": "^18.x",
  "motion": "latest",
  "lucide-react": "latest",
  "hono": "latest (npm:hono for Deno)",
  "@supabase/supabase-js": "^2.x"
}
```

### Browser Compatibility
- Requires browsers that support Spotify Web Playback SDK
- Chrome, Firefox, Edge, Safari (macOS 10.12+)
- Does not work in private/incognito mode

## Troubleshooting

### "Missing authorization header" error
- Ensure Supabase secrets are set correctly
- Check that SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are configured

### "Authentication failed" error
- Verify redirect URI in Spotify Developer Dashboard matches exactly
- Check that all required scopes are requested

### No music playing
- Ensure you have an active Spotify Premium account (required for Web Playback SDK)
- Check browser console for errors
- Verify device is active in Spotify app

### Token refresh failing
- Refresh token may be invalid or expired
- Re-authenticate with Spotify

## License

This project is open source and available for personal and commercial use.

## Credits

Built with Figma Make, powered by Spotify's Web API and Web Playback SDK.

## Live Demo

[https://ribbon-dried-99863478.figma.site](https://ribbon-dried-99863478.figma.site)

---

**Note**: This app requires a Spotify Premium account to use the Web Playback SDK for streaming music directly in the browser.
