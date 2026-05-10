'use client';

import TestComponent from '@/components/TestComponent';

export default function TestUI() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md border border-amber-100 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">UI Test Page</h1>
        <p className="text-gray-700 mb-4">This page tests if Tailwind CSS is working correctly.</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
            Button 1
          </button>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            Button 2
          </button>
        </div>
        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <p className="text-blue-800">This is a test card with background color.</p>
        </div>
        <div className="mt-6">
          <TestComponent />
        </div>
      </div>
    </div>
  );
}