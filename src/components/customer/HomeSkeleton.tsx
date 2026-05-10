'use client';

export default function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 animate-pulse">

      {/* Navbar Skeleton */}
      <div className="h-16 w-full bg-white shadow-sm flex items-center px-6">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
        <div className="ml-auto flex gap-4">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <div className="w-full max-w-4xl text-center space-y-6">

          {/* Welcome chip */}
          <div className="h-8 w-56 bg-gray-200 rounded-full mx-auto"></div>

          {/* Main Heading */}
          <div className="space-y-3">
            <div className="h-12 w-3/4 bg-gray-300 rounded mx-auto"></div>
            <div className="h-12 w-2/3 bg-gray-300 rounded mx-auto"></div>
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <div className="h-5 w-2/3 bg-gray-200 rounded mx-auto"></div>
            <div className="h-5 w-1/2 bg-gray-200 rounded mx-auto"></div>
          </div>

          {/* CTA Button */}
          <div className="h-12 w-40 bg-gray-300 rounded-full mx-auto mt-6"></div>
        </div>
      </div>
    </div>
  );
}
