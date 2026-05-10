'use client';

import React, { ReactNode } from 'react';

interface HeroSectionProps {
  children?: ReactNode;
  className?: string;
  backgroundImage?: string;
  overlayOpacity?: number;
  overlayColor?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  children,
  className = '',
  backgroundImage = '/images/herosection.jpg',
  overlayOpacity = 0.6,
  overlayColor = '0, 0, 0',
}) => {
  const overlayStyle = `linear-gradient(rgba(${overlayColor}, ${overlayOpacity}), rgba(${overlayColor}, ${overlayOpacity}))`;
  
  return (
    <div 
      className={`relative w-full ${className}`}
      style={{
        backgroundImage: `${overlayStyle}, url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {children}
    </div>
  );
};

export default HeroSection;
