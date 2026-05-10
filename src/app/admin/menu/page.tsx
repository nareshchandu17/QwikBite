'use client';

import dynamic from 'next/dynamic';

// Dynamically import the MenuManagement component with no SSR
const MenuManagement = dynamic(
  () => import('@/components/admin/MenuManagement'),
  { ssr: false }
);

// Ensure the page takes full height
export default function MenuPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="relative flex-1">
        {/* Animated background elements */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-green-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-lime-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
        </div>
        
        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .animation-delay-6000 { animation-delay: 6s; }
        `}</style>
        
        <div className="h-full w-full">
          <MenuManagement />
        </div>
      </div>
    </div>
  );
}