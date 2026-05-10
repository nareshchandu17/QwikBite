'use client';

import { motion } from 'framer-motion';

export function MenuSkeletonLoader() {
  // Show 24 cards for 4 cols x 6 rows premium grid
  const skeletonCount = 24;

  // Pulse animation keyframes
  const pulse = {
    animate: {
      opacity: [1, 0.6, 1],
    },
    transition: {
      duration: 2,
      repeat: 2, // Changed from Infinity to 2
      ease: 'easeInOut' as const,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full px-4 sm:px-6 lg:px-8"
    >
      
      {/* Grid Container - Match menu page grid: 4 cols on desktop */}
      <div className="grid grid-cols-4 gap-6 w-full px-4 sm:px-6 lg:px-8">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <motion.div
            key={`skeleton-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: Math.min(index * 0.05, 0.5),
              ease: 'easeOut',
            }}
            className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            style={{ minHeight: '300px', height: '100%' }}
          >
            {/* Image Skeleton - Rounded top with relative positioning */}
            <div className="relative w-full aspect-square">
              <motion.div
                {...pulse}
                className="w-full h-full bg-gray-200"
              />

              {/* Heart Icon Placeholder */}
              <div className="absolute top-3 right-3 z-10">
                <motion.div
                  {...pulse}
                  transition={{
                    ...pulse.transition,
                    delay: 0.15,
                  }}
                  className="w-9 h-9 rounded-full bg-gray-300"
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-3 gap-2.5">
              {/* Title Skeleton */}
              <motion.div
                {...pulse}
                transition={{
                  ...pulse.transition,
                  delay: 0.2,
                }}
                className="h-4 bg-gray-200 rounded-md w-3/4"
              />

              {/* Description Skeleton - 2 lines */}
              <motion.div
                {...pulse}
                transition={{
                  ...pulse.transition,
                  delay: 0.25,
                }}
                className="h-3 bg-gray-200 rounded-sm w-full"
              />
              <motion.div
                {...pulse}
                transition={{
                  ...pulse.transition,
                  delay: 0.3,
                }}
                className="h-3 bg-gray-200 rounded-sm w-2/3"
              />

              {/* Price Skeleton - Center spaced */}
              <div className="flex items-center gap-2 mt-auto pt-2">
                <motion.div
                  {...pulse}
                  transition={{
                    ...pulse.transition,
                    delay: 0.35,
                  }}
                  className="h-5 w-14 bg-gray-200 rounded-md"
                />
              </div>

              {/* Button Skeleton */}
              <motion.div
                {...pulse}
                transition={{
                  ...pulse.transition,
                  delay: 0.4,
                }}
                className="h-9 w-full bg-gray-200 rounded-md mt-2"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Loading Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="flex justify-center items-center mt-12 mb-8"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-2.5 h-2.5 rounded-full bg-amber-500"
          />
          <span className="text-gray-500 text-sm font-medium">Loading menu items...</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default MenuSkeletonLoader;