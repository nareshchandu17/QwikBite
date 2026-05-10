import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-transparent backdrop-blur-[2px] pointer-events-none">
      {/* Subtle Progress Bar at the very top */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[10000]">
        <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 w-full origin-left animate-loading-bar shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
      </div>
      
      {/* Minimal Spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    </div>
  );
}
