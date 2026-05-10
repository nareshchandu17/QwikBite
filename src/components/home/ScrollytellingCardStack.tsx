import {
  motion,
  useScroll,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";
import React, { useRef, useState } from "react";
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
    src: "images/time-slot.jpg",
    icon: Clock,
  },
  {
    step: "STEP 03",
    title: "Live Order Tracking",
    subtitle: "Know exactly when your food is ready.",
    src: "images/tracking.jpg",
    icon: Activity,
  },
  {
    step: "STEP 04",
    title: "Cashless & Secure Payments",
    subtitle: "Pay instantly. No cash. No friction.",
    src: "images/payments.jpg",
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

export const ScrollytellingCardStack: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 🔑 This is the missing link
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const index = Math.min(
      steps.length - 1,
      Math.floor(v * steps.length)
    );
    setActiveIndex(index);
  });

  const step = steps[activeIndex];

  return (
    <section
      ref={containerRef}
      className="relative bg-white py-16"
      style={{ height: `${steps.length * 100}vh` }}
    >
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <h2 className="font-bold text-3xl md:text-4xl text-[#121212] mb-2 font-['Syne']">
          From Order to Pickup
        </h2>
        <p className="text-[#6B7280] font-medium">
          Your food journey in simple steps.
        </p>
      </div>
      <div className="sticky top-0 h-screen flex items-center justify-center">
        {/* Scroll Indicators */}
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 z-30 flex flex-col gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const targetScroll = (index / (steps.length - 1)) * (containerRef.current?.scrollHeight || 0);
                window.scrollTo({
                  top: targetScroll,
                  behavior: 'smooth'
                });
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeIndex === index 
                  ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-500/50' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.94 }}
            transition={{
              duration: 0.1,
              ease: [0.22, 1, 0.36, 1], // Apple easing
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative w-[95vw] max-w-7xl h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img
              src={step.src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="relative z-10 h-full flex flex-col justify-end p-12">
              <div className="flex items-center gap-3 mb-4">
                {React.createElement(step.icon, {
                  className: "h-6 w-6 text-orange-400",
                })}
                <span className="text-sm font-bold tracking-[0.2em] text-white/70">
                  {step.step}
                </span>
              </div>

              <h3 className="font-serif text-5xl text-white mb-4">
                {step.title}
              </h3>

              <p className="max-w-xl text-xl text-white/80">
                {step.subtitle}
              </p>
            </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
