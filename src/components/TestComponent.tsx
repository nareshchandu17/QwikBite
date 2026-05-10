import React from 'react';

const TestComponent = () => {
  return (
    <div className="p-4 bg-blue-500 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2">Test Component</h2>
      <p className="mb-4">This component tests if Tailwind CSS classes are being applied correctly.</p>
      <button className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors">
        Test Button
      </button>
    </div>
  );
};

export default TestComponent;