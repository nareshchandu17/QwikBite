import React from "react";
import { motion } from "framer-motion";
import { useAuthModal } from "@/context/AuthModalContext";
import Image from "next/image";

export const HeroSection: React.FC = () => {
  const { openModal } = useAuthModal();
  return (
    <section className="relative min-h-screen overflow-hidden bg-white px-4 pt-32 sm:px-6 lg:px-8">
      
      {/* 🌟 Multi-layered Background Gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%),
            radial-gradient(ellipse at 20% 30%, rgba(251, 191, 36, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(245, 158, 11, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 10% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 40%)
          `,
        }}
      />
      
      {/* Subtle amber overlay gradient */}
      <div 
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(251, 191, 36, 0.08) 0%, 
              rgba(245, 158, 11, 0.12) 25%, 
              rgba(217, 119, 6, 0.08) 50%, 
              rgba(251, 191, 36, 0.12) 75%, 
              rgba(245, 158, 11, 0.08) 100%
            )
          `
        }}
      />

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-10 h-96 w-96 rounded-full bg-gradient-to-br from-amber-300/25 to-orange-400/15 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-orange-400/20 to-amber-300/15 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-amber-200/15 to-orange-300/15 blur-3xl" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 lg:grid-cols-2">

        {/* LEFT — CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center lg:text-left"
        >
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/5 px-5 py-2">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">
              5,000+ students skip lines daily
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-8 font-serif text-[clamp(3.5rem,6vw,6.5rem)] leading-[0.95] tracking-tight text-gray-900">
            Hungry?{" "}
            <span className="relative inline-block italic text-orange-500">
              Skip the Line
              <svg
                className="absolute -bottom-3 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, delay: 0.6 }}
                  d="M2 8C40 3 80 3 100 5C120 7 160 7 198 3"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <br />
            <span className="italic">Not the Class.</span>
          </h1>

          {/* Subtext */}
          <p className="mx-auto mb-12 max-w-xl text-xl text-gray-600 lg:mx-0">
            Pre-order, pay securely, and pick up fresh food in minutes.
            Campus dining — finally upgraded.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-5 sm:flex-row sm:justify-center lg:justify-start">
            <button className="group relative overflow-hidden rounded-full bg-orange-500 px-12 py-5 text-lg font-black text-white shadow-xl shadow-orange-500/30 transition-all hover:scale-[1.04] cursor-pointer"
            onClick={() => openModal('signin')}
            >
              Order Lunch Now
              <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>

            
          </div>
        </motion.div>

        {/* RIGHT — VISUAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex justify-center lg:justify-end"
        >
          {/* Image-local glow (kept subtle) */}
          <div className="absolute inset-0 -z-10 rounded-full bg-orange-500/20 blur-[160px]" />

          {/* Floating Image */}
          <motion.div
            animate={{ y: [0, -18, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-[120%] max-w-[760px] translate-x-12"
          >
            <Image
              src="/images/heroimage.png"
              alt="qwikBite App Preview"
              width={760}
              height={500}
              priority
              className="w-full drop-shadow-[0_60px_80px_rgba(0,0,0,0.35)]"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparentz to-transparent" />
    </section>
  );
};
