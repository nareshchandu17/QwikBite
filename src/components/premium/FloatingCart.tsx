'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function FloatingCart(){
  return (
    <button className="fixed right-6 bottom-6 z-50 bg-amber-500 text-black px-4 py-3 rounded-full shadow-lg flex items-center gap-2">
      <ShoppingCart />
      <span className="font-semibold">Cart</span>
    </button>
  );
}
