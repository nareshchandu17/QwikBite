import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Star } from "lucide-react";
import React from "react";

const testimonials = [
  {
    name: "Rahul D.",
    handle: "@rahul_codes",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
    content:
      "Saved me so much time during finals! Pre-ordered from the library and walked in just as it was ready. 🚀",
    likes: 124,
    comments: 12,
  },
  {
    name: "Priya M.",
    handle: "@priya_eats",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    content:
      "The cold coffee at Canteen B is top tier. And no line? Yes please. 🥤 ✨",
    likes: 124,
    comments: 12,
  },
  {
    name: "Sam K.",
    handle: "@sam_des",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
    content:
      "Finally an app that actually looks good and works perfectly. The dark mode is 🔥",
    likes: 124,
    comments: 12,
  },
];

const stats = [
  { value: "5k+", label: "Orders Delivered" },
  { value: "4.8", label: "App Store Rating", icon: true },
];

export const SocialProofSection: React.FC = () => {
  return (
    <section className="bg-[#FFF8F0] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 flex flex-col items-start justify-between gap-10 sm:flex-row sm:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-[hsl(24_85%_55%)]">
              Vibe Check
            </span>
            <h2 className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-[#1A1A1A]">
              Campus Vibes <span className="inline-block">✌️</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-left">
                <div className="flex items-center gap-1.5 text-5xl font-black text-[#1A1A1A]">
                  {stat.value}
                  {stat.icon && (
                    <Star className="h-8 w-8 text-[hsl(24_85%_55%)] fill-[hsl(24_85%_55%)]" />
                  )}
                </div>
                <p className="mt-1 text-sm font-bold uppercase tracking-widest text-gray-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Testimonials */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.handle}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="
                group rounded-3xl
                border border-black/10
                bg-white
                p-8
                transition-all
                hover:-translate-y-2
                hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]
                hover:shadow-[0_0_30px_rgba(240,152,25,0.15)]
                hover:shadow-[0_0_60px_rgba(240,152,25,0.1)]
                relative
                before:absolute
                before:inset-0
                before:rounded-3xl
                before:border
                before:border-black/10
                before:bg-white
                before:content-['']
                before:-z-10
                before:transition-all
                before:duration-300
                hover:before:shadow-[0_0_20px_rgba(240,152,25,0.2)]
                hover:before:shadow-[0_0_40px_rgba(240,152,25,0.15)]
              "
            >
              <div className="mb-6 flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="h-14 w-14 rounded-full bg-gray-100 ring-4 ring-gray-200"
                />
                <div>
                  <p className="text-lg font-bold text-[#1A1A1A]">
                    {testimonial.name}
                  </p>
                  <p className="text-sm font-medium text-gray-500">
                    {testimonial.handle}
                  </p>
                </div>
              </div>

              <p className="mb-8 text-lg font-medium leading-relaxed text-[#1A1A1A]/80">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-8 text-gray-500">
                <button className="flex items-center gap-2 text-sm font-bold transition-colors hover:text-red-500">
                  <Heart className="h-4 w-4" />
                  {testimonial.likes}
                </button>

                <button className="flex items-center gap-2 text-sm font-bold transition-colors hover:text-[hsl(24_85%_55%)]">
                  <MessageCircle className="h-4 w-4" />
                  {testimonial.comments}
                </button>

                <button className="ml-auto transition-colors hover:text-[hsl(24_85%_55%)]">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
