'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { PremiumCard } from '.';

interface Props { items: unknown[] }

export default function CarouselRow({ items }: Props) {
  const sc = useRef<HTMLDivElement | null>(null);
  return (
    <div className="relative">
      <div ref={sc} className="flex gap-4 overflow-x-auto hide-scrollbar py-2">
        {items.map(item => (
          <motion.div whileHover={{ scale: 1.02 }} key={item.id} className="min-w-[260px]">
            <PremiumCard item={item} compact />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
