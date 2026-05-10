"use client";

import React from "react";
import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="w-full py-24 flex flex-col items-center text-center">
      <div className="w-48 h-48 bg-gradient-to-br from-slate-800 to-black rounded-xl flex items-center justify-center mb-6">
        <div className="text-6xl">🍽️</div>
      </div>
      <h3 className="text-xl font-semibold text-white">You haven&apos;t placed any orders yet.</h3>
      <p className="text-slate-400 mt-2">Explore our menu and order something delicious.</p>
      <Link href="/menu" className="mt-6 px-6 py-2 bg-amber-400 text-black rounded-full font-medium">Explore Menu</Link>
    </div>
  );
}
