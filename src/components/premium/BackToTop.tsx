'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop(){
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <button onClick={scrollTop} className="fixed right-6 bottom-20 z-50 bg-white/5 text-gray-100 px-3 py-2 rounded-full shadow-md">
      <ArrowUp />
    </button>
  );
}
