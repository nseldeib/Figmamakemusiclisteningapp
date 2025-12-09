import type { Metadata } from 'next'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Retro Player',
  description: 'Your vintage vinyl experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          src="https://sdk.scdn.co/spotify-player.js"
          async
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
