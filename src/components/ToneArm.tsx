import { motion } from 'motion/react'

interface ToneArmProps {
  isPlaying: boolean
}

export function ToneArm({ isPlaying }: ToneArmProps) {
  return (
    <motion.div
      className="absolute top-8 right-0 w-48 h-2 origin-right"
      animate={{ rotate: isPlaying ? -25 : 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Arm */}
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full shadow-lg" />
        <div className="absolute top-1/2 left-0 w-3 h-3 -translate-y-1/2 bg-gray-600 rounded-full shadow-md" />
      </div>
      
      {/* Needle */}
      <div className="absolute -bottom-2 left-0 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-gray-700" />
    </motion.div>
  )
}
