'use client';

import { useEffect } from 'react';

export default function GlobalStyles() {
  useEffect(() => {
    // Add any client-side style initialization here if needed
  }, []);

  return (
    <style jsx global>{`
      body {
        font-family: 'Inter', sans-serif;
        background-color: #050505;
        color: #ffffff;
      }
      .glass-surface {
        background: rgba(20, 20, 20, 0.6);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
      }
      .shadow-glow-primary {
        box-shadow: 0 0 20px rgba(255, 81, 47, 0.3);
      }
      .shadow-glow-secondary {
        box-shadow: 0 0 20px rgba(240, 152, 25, 0.3);
      }
      .shadow-glow-tertiary {
        box-shadow: 0 0 20px rgba(255, 195, 0, 0.3);
      }
      .dark-bg {
        background-color: #050505;
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.05);
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #FF512F, #F09819);
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #FF512F;
      }
    `}</style>
  );
}
