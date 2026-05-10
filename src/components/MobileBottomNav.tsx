'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useActivePage } from '@/hooks/useActivePage';
import { useEffect, useState } from 'react';
import { Utensils, ShoppingBag, Heart, MessageCircle } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Menu', href: '/menu', icon: Utensils },
  { label: 'Orders', href: '/customer/orders', icon: ShoppingBag },
  { label: 'Favorites', href: '/favorites', icon: Heart },
  { label: 'Feedback', href: '/feedback', icon: MessageCircle },
];

/**
 * Mobile Bottom Navigation Bar
 * - Only visible on mobile/tablet devices
 * - Auto-hides when keyboard is open
 * - Glassmorphic design with smooth animations
 * - Highlights active page
 */
export function MobileBottomNav() {
  const { isActive } = useActivePage();
  const [isVisible, setIsVisible] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Hide bottom nav when keyboard opens (input focus)
  useEffect(() => {
    const handleFocus = () => {
      // Check if focused element is an input, textarea, or select
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;

      setIsKeyboardOpen(isInputFocused);
    };

    const handleBlur = () => {
      setIsKeyboardOpen(false);
    };

    // Listen for focus/blur on all input elements
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Hide when keyboard is open
  useEffect(() => {
    setIsVisible(!isKeyboardOpen);
  }, [isKeyboardOpen]);

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-20 md:hidden" />

      {/* Mobile Bottom Navigation */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ 
          y: isVisible ? 0 : 100,
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          willChange: 'transform, opacity',
        }}
      >
        {/* Glassmorphic Background */}
        <div className="relative">
          {/* Blur backdrop */}
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50" />
          
          {/* Shadow overlay for depth */}
          <div className="absolute inset-0 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]" />

          {/* Navigation Content */}
          <div className="relative flex items-center justify-around px-4 py-3 safe-area-inset-bottom">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center flex-1 min-w-0 group"
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Icon Container */}
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`
                      relative flex items-center justify-center
                      w-12 h-12 rounded-2xl
                      transition-all duration-200
                      ${
                        active
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
                          : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        w-5 h-5 transition-colors duration-200
                        ${
                          active
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                        }
                      `}
                    />

                    {/* Ripple effect on tap */}
                    {active && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="absolute inset-0 rounded-2xl bg-amber-500/20"
                      />
                    )}
                  </motion.div>

                  {/* Label */}
                  <span
                    className={`
                      mt-1 text-xs font-medium transition-colors duration-200 truncate max-w-full
                      ${
                        active
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
