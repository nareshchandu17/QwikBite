import { motion, Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import React from "react";
import { useAuthModal } from "@/context/AuthModalContext";
import Image from "next/image";

const fadeScaleVariant: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

export const CTASection: React.FC = () => {
  const { openModal } = useAuthModal();

  // Motion variants for consistency
  const textVariant: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const imageVariant: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.2 } },
  };

  return (
    <section className="relative overflow-hidden bg-[#1A1A1A] min-h-screen">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-12 lg:px-20 flex items-center justify-between min-h-screen">
        <div className="relative flex flex-col items-start gap-24 lg:flex-row lg:items-center lg:gap-48">
          
          {/* Left Text Content */}
          <motion.div
            variants={textVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.3 }}
            className="flex-[0.65] text-center lg:text-left lg:pr-24"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{}}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5"
            >
              <Sparkles className="h-4 w-4 text-[hsl(24_85%_55%)]" />
              <span className="text-xs font-black uppercase tracking-[0.25em] text-white/90">
                The Campus Standard
              </span>
            </motion.div>

            {/* Headline */}
            <h2 className="mb-6 font-serif text-5xl sm:text-6xl lg:text-7xl font-normal leading-tight text-white">
              Designed
              <br />
              for <span className="italic text-[hsl(24_85%_55%)]">Speed.</span>
              <br />
              <span className="font-bold">Built for</span>
              <br />
              Taste.
            </h2>

            {/* Description */}
            <p className="mb-9 mx-auto max-w-lg text-xl text-white/60 lg:mx-0">
              Join the elite circle of 5,000+ students reclaiming their time.
              Smart dining is just one tap away.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-8 sm:flex-row lg:items-center">
              <button
                onClick={() => openModal('signup')}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(24_85%_55%)] px-8 py-4 text-base font-black text-white transition-all hover:scale-105 shadow-2xl shadow-[hsl(24_85%_55%)]/20 sm:w-auto cursor-pointer"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </button>

              {/* Avatars */}
              <div className="flex flex-col items-center gap-3 sm:items-start">
                <div className="flex -space-x-3">
                  {["alice", "bob", "carol", "dave"].map((seed) => (
                    <Image
                      key={seed}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 rounded-full border-4 border-[#1A1A1A] bg-gray-200 shadow-lg"
                    />
                  ))}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#1A1A1A] bg-[hsl(24_85%_55%)] text-sm font-black text-white shadow-lg">
                    5k+
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Verified Campus Users
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Image Content */}
          <motion.div
            variants={imageVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.3 }}
            className="flex-[1.35] w-full max-w-3xl lg:max-w-5xl ml-auto"
          >
            <div className="relative mx-auto lg:scale-[1.65] lg:translate-x-56 origin-right transition-transform duration-700">
              <div className="rounded-[3rem] border-8 border-white/10 bg-white/5 p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                <div className="relative aspect-[9/15] overflow-hidden rounded-[2rem] bg-white">
                  <Image
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=1000&fit=crop"
                    alt="Healthy bowl"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent p-8">
                    <p className="mb-2 text-3xl font-black leading-tight text-white">
                      Your Bowl is Ready.
                    </p>
                    <p className="text-sm font-bold uppercase tracking-widest text-[hsl(24_85%_55%)]">
                      Pickup at Station A
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Confirmation */}
              <motion.div
                variants={fadeScaleVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ amount: 0.3 }}
                className="absolute -right-6 top-16 flex items-center gap-4 rounded-3xl bg-white p-6 shadow-2xl border border-black/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 shadow-lg shadow-green-500/20">
                  <span className="text-xl font-bold text-white">✓</span>
                </div>
                <div>
                  <p className="text-lg font-black text-[#1A1A1A]">Order Placed!</p>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                    Ready in 4 mins
                  </p>
                </div>
              </motion.div>

              {/* Emoji Badge */}
              <motion.div
                variants={fadeScaleVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ amount: 0.3 }}
                className="absolute -left-8 bottom-32 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[hsl(24_85%_55%)] text-white shadow-2xl shadow-[hsl(24_85%_55%)]/30 border-4 border-[#1A1A1A]"
              >
                <span className="text-3xl">🥗</span>
                <span className="mt-1 text-[10px] font-black uppercase tracking-widest">
                  Fresh!
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ambient Glows */}
      <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[hsl(24_85%_55%)]/5 blur-[120px]" />
      <div className="absolute -right-40 bottom-20 h-[400px] w-[400px] rounded-full bg-[hsl(24_85%_55%)]/5 blur-[120px]" />
    </section>
  );
};
