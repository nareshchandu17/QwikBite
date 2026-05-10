'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';

interface SmartHeaderWrapperProps {
  children: ReactNode;
  threshold?: number;
  hideOnScrollDown?: boolean;
}

/**
 * Smart Header Wrapper - adds scroll-based hide/show behavior to any header component
 * Wraps your existing header without modifying its UI or styles
 */
export function SmartHeaderWrapper({
  children,
  threshold = 50,
  hideOnScrollDown = true,
}: SmartHeaderWrapperProps) {
  const scrollDirection = useScrollDirection({ threshold });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!hideOnScrollDown) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show header at the top of the page
      if (currentScrollY < threshold) {
        setIsVisible(true);
        return;
      }

      // Show/hide based on scroll direction
      if (scrollDirection === 'down') {
        setIsVisible(false);
      } else if (scrollDirection === 'up') {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollDirection, threshold, hideOnScrollDown]);

  return (
    <motion.div
      initial={false}
      animate={{
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Custom easing for smooth motion
      }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </motion.div>
  );
}
