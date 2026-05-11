import React, { useEffect, useState } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/stores/cartStore";
import UserDropdown from "@/components/UserDropdown";
import Link from "next/link";

export const Header: React.FC = () => {
  const { openModal } = useAuthModal();
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.count());

  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:pt-6 pointer-events-none">
      <nav
        className="
          w-full max-w-6xl rounded-full px-8 py-3 pointer-events-auto
          flex items-center justify-between
          border-2 border-[hsl(214.3_31.8%_91.4%)]
          bg-[hsl(0_0%_100%)]/80
          backdrop-blur-xl
          shadow-lg
          shadow-[0_10px_40px_rgba(0,0,0,0.08)]
          transition-all duration-300
        "
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div
            className="
              relative w-10 h-10
              bg-[hsl(24_85%_55%)]
              rounded-full
              flex items-center justify-center
              text-[hsl(210_40%_98%)]
              font-bold text-xl
              transition-transform
              group-hover:rotate-12
              shadow-sm
            "
          >
            C
            <div
              className="
                absolute inset-0
                bg-[hsl(24_85%_55%)]
                rounded-full
                blur-md
                opacity-0
                group-hover:opacity-40
                transition-opacity
              "
            />
          </div>

          <span
            className="
              font-serif font-black text-2xl tracking-tighter
              text-[hsl(222.2_84%_4.9%)]
            "
          >
            qwikBite
          </span>
        </Link>

        {/* Right Side CTA Actions */}
        <div className="flex items-center gap-4 md:gap-8">
          {mounted && (
            <Link
              href="/cart"
              className="relative group/cart cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors pointer-events-auto"
            >
              <ShoppingCart
                className="w-5 h-5 text-[hsl(222.2_84%_4.9%)] group-hover/cart:text-[hsl(24_85%_55%)] transition-colors"
              />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[hsl(24_85%_55%)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[18px] h-[18px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {mounted && isAuthenticated && user ? (
            <UserDropdown user={user} />
          ) : (
            <>
              <button
                onClick={() => openModal('signin')}
                className="
                  hidden sm:block
                  font-black text-sm uppercase tracking-widest
                  text-[hsl(222.2_84%_4.9%)]
                  hover:text-[hsl(24_85%_55%)]
                  transition-colors
                  relative group/signin cursor-pointer
                "
              >
                Sign In
                <span
                  className="
                    absolute -bottom-1 left-0
                    w-0 h-0.5
                    bg-[hsl(24_85%_55%)]
                    transition-all duration-300
                    group-hover/signin:w-full
                  "
                />
              </button>

              <button
                onClick={() => openModal('signup')}
                className="
                  group/getstarted
                  relative overflow-hidden
                  px-6 md:px-8 py-3
                  bg-[#1A1A1A]
                  text-[hsl(210_40%_98%)]
                  rounded-full
                  font-semibold text-sm tracking-wide
                  transition-all duration-300
                  hover:scale-105
                  hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.4)]
                  active:scale-95
                  flex items-center gap-2 cursor-pointer
                "
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover/getstarted:translate-x-1"
                  />
                </span>

                {/* Glossy overlay */}
                <div
                  className="
                    absolute inset-0
                    bg-gradient-to-r
                    from-transparent
                    via-white/10
                    to-transparent
                    -translate-x-full
                    group-hover/getstarted:translate-x-full
                    transition-transform duration-700 ease-in-out
                  "
                />

                {/* Orange glow hover */}
                <div
                  className="
                    absolute inset-0
                    bg-[hsl(24_85%_55%)]
                    opacity-0
                    group-hover/getstarted:opacity-100
                    transition-opacity duration-300
                  "
                />
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};
