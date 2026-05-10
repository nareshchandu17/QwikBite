"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

type AccordionItem = {
  id: string;
  title: string;
  content: React.ReactNode;
};

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div 
          key={item.id} 
          className={`relative p-[1px] rounded-lg transition-all duration-300 ${
            hoveredItem === item.id 
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 shadow-lg shadow-amber-500/30' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-transparent">
            <button
              aria-expanded={open === item.id}
              onClick={() => setOpen(open === item.id ? null : item.id)}
              className="w-full text-left px-6 py-4 flex items-center justify-between"
            >
              <span className="font-semibold text-lg md:text-xl text-gray-800 dark:text-gray-100">
                {item.title}
              </span>
              <ChevronDown 
                className={`h-6 w-6 text-gray-500 transform transition-transform duration-200 ${
                  open === item.id ? 'rotate-180' : ''
                }`} 
              />
            </button>

            <AnimatePresence initial={false}>
              {open === item.id && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="px-6 pt-2 pb-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-base md:text-lg overflow-hidden"
                >
                  {item.content}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Accordion;