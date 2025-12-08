import { motion } from 'motion/react'

interface VinylRecordProps {
  albumArt?: string
  isPlaying: boolean
}

export function VinylRecord({ albumArt, isPlaying }: VinylRecordProps) {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      {/* Vinyl record */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black shadow-2xl"
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{
          duration: 3,
          repeat: isPlaying ? Infinity : 0,
          ease: "linear"
        }}
      >
        {/* Grooves */}
        <div className="absolute inset-0 rounded-full opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-gray-700"
              style={{
                margin: `${i * 6}px`,
              }}
            />
          ))}
        </div>

        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100 shadow-lg border-4 border-gray-800 overflow-hidden">
          {albumArt ? (
            <img
              src={albumArt}
              alt="Album art"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-amber-900 opacity-60">
                <div className="text-xs">RETRO</div>
                <div className="text-lg">♪</div>
                <div className="text-xs">PLAYER</div>
              </div>
            </div>
          )}
        </div>

        {/* Center hole */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-900 shadow-inner" />
      </motion.div>

      {/* Vinyl shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
    </div>
  )
}
