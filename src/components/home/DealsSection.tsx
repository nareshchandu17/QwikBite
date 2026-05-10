import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuthModal } from "@/context/AuthModalContext";

export const DealsSection: React.FC = () => {
  const { openModal } = useAuthModal();
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 12,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <section className="relative overflow-hidden bg-[#1A1A1A] py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="
                mb-8 inline-flex items-center gap-2
                rounded-full
                bg-[hsl(24_85%_55%)]/20
                px-4 py-2
                border border-[hsl(24_85%_55%)]/30
              "
            >
              <Zap className="h-4 w-4 text-[hsl(24_85%_55%)]" />
              <span className="text-sm font-bold text-[hsl(24_85%_55%)] uppercase tracking-wider">
                Flash Deal
              </span>
            </motion.div>

            <h2 className="mb-8 font-serif text-5xl sm:text-6xl lg:text-7xl leading-tight text-white">
              Mid-Sem
              <br />
              Cravings?
              <br />
              <span className="font-bold italic text-[hsl(24_85%_55%)]">
                Get 20% OFF
              </span>{" "}
              on
              <br />
              Beverages.
            </h2>

            <p className="mb-6 text-xl text-white/60">
              Available daily between 2 PM - 4 PM. Use code:
            </p>

            <div className="inline-block rounded-2xl bg-white/10 px-8 py-4 backdrop-blur-md border border-white/10">
              <span className="font-mono text-2xl font-black tracking-[0.2em] text-[hsl(24_85%_55%)]">
                CHILL20
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="
              w-full rounded-[2.5rem]
              bg-white/5
              p-10
              backdrop-blur-sm
              lg:w-auto
              border border-white/10
            "
          >
            <div className="mb-8 flex items-center justify-center gap-3 text-white/50">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-[0.2em]">
                Offer Ends In
              </span>
            </div>

            <div className="mb-10 flex items-center justify-center gap-4">
              {[
                { label: "Hours", value: timeLeft.hours },
                { label: "Mins", value: timeLeft.minutes },
                { label: "Secs", value: timeLeft.seconds },
              ].map((item, idx) => (
                <React.Fragment key={item.label}>
                  <div className="flex flex-col items-center">
                    <div className="
                      flex h-20 w-20 sm:h-28 sm:w-28
                      items-center justify-center
                      rounded-2xl
                      bg-white
                      text-4xl sm:text-5xl
                      font-black
                      text-[#1A1A1A]
                    ">
                      {formatNumber(item.value)}
                    </div>
                    <span className="mt-3 text-xs font-bold uppercase tracking-widest text-white/40">
                      {item.label}
                    </span>
                  </div>

                  {idx < 2 && (
                    <span className="text-3xl font-bold text-white/20">:</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              className="
                w-full rounded-full
                bg-[hsl(24_85%_55%)]
                py-6
                text-lg font-black
                text-white
                hover:scale-105
                transition-all
                shadow-xl
                shadow-[hsl(24_85%_55%)]/20 cursor-pointer 
              "
              onClick={() => openModal('signin')}
            >
              Claim Offer
            </button>
          </motion.div>
        </div>
      </div>

      <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-[hsl(24_85%_55%)]/5 blur-[120px]" />
      <div className="absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-[hsl(24_85%_55%)]/5 blur-[120px]" />
    </section>
  );
};
