'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Payments component with no SSR
const Payments = dynamic(
  () => import('@/components/admin/Payments'),
  { ssr: false }
);

export default function PaymentPage() {
  return (
    <div className="space-y-8 pb-8">
      
      <div className="relative">
        {/* Animated background elements */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
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
        
        <Payments />
      </div>
    </div>
  );
}