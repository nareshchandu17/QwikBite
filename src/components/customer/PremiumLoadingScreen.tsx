'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function PremiumLoadingScreen() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      
      {/* Background Image */}
      <Image
        src="/images/herosection.jpg"
        alt="Canteen hero"
        fill
        priority
        className="object-cover"
      />

      {/* Dark cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      {/* Ambient glow blobs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[160px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-400/20 rounded-full blur-[140px]" />

      {/* Glass Loader Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="
          relative z-10
          max-w-3xl w-full mx-4
          rounded-3xl
          backdrop-blur-2xl
          bg-white/10
          border border-white/20
          shadow-[0_0_80px_rgba(255,165,0,0.18)]
          px-8 py-16
          text-center
        "
      >

        {/* Floating shimmer badge */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="
            inline-block mb-6
            px-5 py-2 rounded-full
            bg-white/15 border border-white/25
            text-sm text-white/70
          "
        >
          Loading your campus experience…
        </motion.div>

        {/* Headline shimmer */}
        <div className="space-y-4 mb-10">
          <div className="h-14 sm:h-16 rounded-full bg-[linear-gradient(110deg,rgba(255,255,255,0.08),rgba(255,180,80,0.35),rgba(255,255,255,0.08))] bg-[length:200%_100%] animate-shimmer" />
          <div className="h-14 sm:h-16 w-3/4 mx-auto rounded-full bg-[linear-gradient(110deg,rgba(255,255,255,0.08),rgba(255,160,60,0.3),rgba(255,255,255,0.08))] bg-[length:200%_100%] animate-shimmer" />
        </div>

        {/* Subtitle shimmer */}
        <div className="h-6 w-2/3 mx-auto rounded-full bg-white/15 mb-12 animate-fade" />

        {/* CTA illusion */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="
            inline-flex items-center justify-center
            h-12 w-40 rounded-full
            bg-gradient-to-r from-amber-500/70 to-orange-600/70
            shadow-[0_0_40px_rgba(255,165,0,0.45)]
          "
        />
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent" />

      {/* Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2.4s linear infinite;
        }
        .animate-fade {
          animation: fade 2.2s ease-in-out infinite;
        }
        @keyframes fade {
          0%,100% { opacity: 0.4; }
          50% { opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
