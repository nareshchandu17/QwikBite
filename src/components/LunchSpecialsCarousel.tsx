'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PlaceholderImage from '@/components/PlaceholderImage';
import { MenuItem } from '@/data/menu';

interface LunchSpecialsCarouselProps {
  items: MenuItem[];
  onBuyNow?: (item: MenuItem) => void;
}

const LunchSpecialsCarousel: React.FC<LunchSpecialsCarouselProps> = ({ items, onBuyNow }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      {/* Carousel */}
      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide gap-4 py-4 pl-4 md:pl-8 pr-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-64 flex-shrink-0 p-2">
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBuyNow && onBuyNow(item);
              }}
              className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 h-full flex flex-col border border-gray-100/50 dark:border-gray-700/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1 cursor-pointer"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              {/* Glow border */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:via-amber-500/5 group-hover:to-amber-500/10 transition-all duration-500 -z-20"></div>
              {/* Animated border */}
              <div className="absolute inset-0 rounded-xl p-[1px] pointer-events-none">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/0 via-amber-400/0 to-amber-400/0 group-hover:via-amber-400/30 group-hover:to-amber-400/10 transition-all duration-500"></div>
              </div>
              <div className="relative h-40 w-full">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <PlaceholderImage
                    width={256}
                    height={160}
                    text={item.name}
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">{item.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{item.description}</p>
                <div className="mt-auto flex justify-between items-center">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{item.price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuyNow && onBuyNow(item);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer hover:scale-105 transform transition-transform"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default LunchSpecialsCarousel;