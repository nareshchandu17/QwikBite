import React from 'react';

export default function CustomerLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[80vh] bg-gray-100 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-3xl w-full px-4 space-y-6 text-center">
            <div className="h-12 w-3/4 bg-gray-200 rounded-lg mx-auto" />
            <div className="h-12 w-1/2 bg-gray-200 rounded-lg mx-auto" />
            <div className="h-6 w-2/3 bg-gray-200 rounded-lg mx-auto" />
            <div className="h-12 w-40 bg-gray-200 rounded-full mx-auto mt-8" />
          </div>
        </div>
      </div>

      {/* Categories/Features Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto" />
              <div className="h-6 w-32 bg-gray-100 rounded mx-auto" />
              <div className="h-4 w-full bg-gray-50 rounded" />
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="space-y-4 mb-12 text-center">
          <div className="h-10 w-64 bg-gray-100 rounded-lg mx-auto" />
          <div className="h-4 w-96 bg-gray-50 rounded mx-auto" />
        </div>

        {/* Carousel Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 p-4 space-y-4">
              <div className="aspect-square w-full bg-gray-100 rounded-xl" />
              <div className="h-6 w-3/4 bg-gray-100 rounded" />
              <div className="flex justify-between items-center">
                <div className="h-6 w-16 bg-gray-100 rounded" />
                <div className="h-10 w-24 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
