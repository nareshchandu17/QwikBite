'use client';

import React from 'react';

interface PlaceholderImageProps {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ 
  width = 200, 
  height = 200, 
  text = 'Food Item',
  className = ''
}) => {
  return (
    <div 
      className={`bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <span className="text-gray-500 dark:text-gray-400 text-sm font-medium text-center px-2">
        {text}
      </span>
    </div>
  );
};

export default PlaceholderImage;