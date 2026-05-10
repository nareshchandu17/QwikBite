'use client';

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-orange-50/30 to-yellow-50/30"></div>
      {/* Simple animated elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-yellow-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
    </div>
  );
}

export default AnimatedBackground;