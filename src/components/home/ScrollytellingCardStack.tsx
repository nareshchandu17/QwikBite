"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ReactLenis } from "lenis/react";
import React, { useRef } from "react";
import Image from "next/image";
import {
  Smartphone,
  Clock,
  Activity,
  CreditCard,
  CheckCircle,
} from "lucide-react";

const steps = [
  {
    step: "STEP 01",
    title: "Order from Class",
    subtitle: "Skip the queue. Order without leaving your seat.",
    src: "/images/order.jpg",
    icon: Smartphone,
  },
  {
    step: "STEP 02",
    title: "Choose Your Time Slot",
    subtitle: "Your food, ready exactly when you need it.",
    src: "/images/time-slot.jpg",
    icon: Clock,
  },
  {
    step: "STEP 03",
    title: "Live Order Tracking",
    subtitle: "Know exactly when your food is ready.",
    src: "/images/tracking.jpg",
    icon: Activity,
  },
  {
    step: "STEP 04",
    title: "Cashless & Secure Payments",
    subtitle: "Pay instantly. No cash. No friction.",
    src: "/images/payments.jpg",
    icon: CreditCard,
  },
  {
    step: "FINAL STEP",
    title: "Pick Up in 5 Minutes",
    subtitle: "Fresh food. Zero waiting.",
    src: "/images/pickup.jpg",
    icon: CheckCircle,
  },
];

const StickyCard = ({
  i,
  step,
  title,
  subtitle,
  src,
  icon: Icon,
  progress,
  range,
  targetScale,
}: {
  i: number;
  step: string;
  title: string;
  subtitle: string;
  src: string;
  icon: any;
  progress: any;
  range: [number, number];
  targetScale: number;
}) => {
  const container = useRef<HTMLDivElement>(null);
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={container}
      className="sticky top-0 flex h-screen items-center justify-center"
    >
      <motion.div
        style={{
          scale,
          top: `calc(-5vh + ${i * 25}px)`,
        }}
        className="
          relative h-[500px] w-full max-w-5xl origin-top overflow-hidden rounded-[3rem]
          bg-[#1A1A1A] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]
          border border-white/10
        "
      >
        <Image 
          src={src} 
          alt={title} 
          fill
          className="h-full w-full object-cover opacity-90 transition-opacity duration-500" 
        />
        {/* Subtle Lighting Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(24_85%_55%)]/15 via-transparent to-white/10 pointer-events-none" />
        
        {/* Adjusted Bottom Shadow for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <div className="relative z-10 flex h-full flex-col justify-end p-8 md:p-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(24_85%_55%)]/20 text-[hsl(24_85%_55%)] backdrop-blur-md">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.4em] text-white/50">
              {step}
            </span>
          </motion.div>
          
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-6 font-serif text-4xl md:text-7xl font-normal text-white"
          >
            {title}
          </motion.h3>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-2xl text-xl md:text-2xl font-medium leading-relaxed text-white/60"
          >
            {subtitle}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export const ScrollytellingCardStack: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <ReactLenis root>
      <section
        ref={container}
        className="relative flex w-full flex-col items-center justify-center bg-white"
      >
        <div className="w-full max-w-7xl px-6 pt-32 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="font-serif text-5xl md:text-7xl text-[#121212] mb-6">
              From Order <br />
              <span className="italic text-[hsl(24_85%_55%)]">to Pickup</span>
            </h2>
            <p className="text-xl text-[#6B7280] font-medium leading-relaxed">
              Experience the future of campus dining. 
              Our seamless flow ensures you spend more time enjoying your food and less time waiting for it.
            </p>
          </motion.div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 pb-[10vh]">
          {steps.map((step, i) => {
            const targetScale = 1 - (steps.length - i - 1) * 0.05;
            return (
              <StickyCard
                key={`step_${i}`}
                i={i}
                {...step}
                progress={scrollYProgress}
                range={[i * (1 / steps.length), 1]}
                targetScale={targetScale}
              />
            );
          })}
        </div>
        
        {/* Ambient scroll indicator */}
        <div className="absolute left-1/2 top-[15%] grid -translate-x-1/2 content-start justify-items-center gap-6 text-center opacity-20">
          <span className="relative max-w-[12ch] text-[10px] font-black uppercase tracking-widest leading-tight">
            Scroll to explore
          </span>
        </div>
      </section>
    </ReactLenis>
  );
};
