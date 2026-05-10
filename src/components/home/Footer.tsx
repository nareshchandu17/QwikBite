import { motion } from "framer-motion";
import { Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react";
import React from "react";

const footerLinks = {
  product: [
    { label: "Menu", href: "#" },
    { label: "How it Works", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "Student Offers", href: "#" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Press Kit", href: "#" },
  ],
  support: [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 py-24 border-t border-white/20 overflow-hidden">
      {/* Moving Gradient Background */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#FF512F]/20 via-[#F09819]/20 to-[#FFD700]/20
        bg-[length:300%_300%] animate-gradientShift"
      ></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 backdrop-blur-lg">
        
        {/* Top Grid */}
        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-5">
          
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl 
                bg-gradient-to-br from-[#FF512F] via-[#F09819] to-[#FFD700] text-2xl font-black text-white shadow-lg shadow-[#FF512F]/30">
                C
              </div>
              <span className="font-serif text-3xl font-black tracking-tighter text-[#1A1A1A]">
                qwikBite
              </span>
            </div>

            <p className="mb-10 max-w-sm text-lg font-medium leading-relaxed text-gray-800">
              The smartest way to eat on campus. Pre-order, pay online, and pick up
              fresh food in minutes.
            </p>

            <div className="space-y-4 text-base font-semibold text-gray-800">
              <div className="flex items-center gap-3 transition-all hover:translate-x-1 hover:text-[#FF512F]">
                <Mail className="h-5 w-5 text-[#FF512F]" />
                <span>hello@qwikbite.app</span>
              </div>
              <div className="flex items-center gap-3 transition-all hover:translate-x-1 hover:text-[#FF512F]">
                <Phone className="h-5 w-5 text-[#FF512F]" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 transition-all hover:translate-x-1 hover:text-[#FF512F]">
                <MapPin className="h-5 w-5 text-[#FF512F]" />
                <span>IIT Delhi Campus, India</span>
              </div>
            </div>
          </motion.div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links], i) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <h3 className="mb-8 text-xs font-black uppercase tracking-[0.25em] text-gray-900">
                {category}
              </h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="
                        inline-block text-base font-semibold text-gray-700
                        transition-all hover:text-[#FF512F]
                        hover:translate-x-1
                      "
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20 flex flex-col items-center justify-between gap-10 border-t border-white/20 pt-12 sm:flex-row"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-700">
            © 2026 qwikBite Campus. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="
                  flex h-12 w-12 items-center justify-center rounded-2xl
                  bg-white/20 text-[#1A1A1A]
                  transition-all hover:-translate-y-1 hover:scale-105
                  hover:bg-gradient-to-br from-[#FF512F] via-[#F09819] to-[#FFD700] hover:text-white
                  shadow-lg shadow-[#FF512F]/20
                "
              >
                <social.icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Gradient Animation Keyframes */}
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradientShift {
            animation: gradientShift 20s ease infinite;
            background-size: 300% 300%;
          }
        `}
      </style>
    </footer>
  );
};
