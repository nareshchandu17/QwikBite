import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Search } from 'lucide-react';

interface AnimatedGlowingSearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const AnimatedGlowingSearchBar = forwardRef<HTMLInputElement, AnimatedGlowingSearchBarProps>(({
  className = '',
  value = '',
  onChange,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isFocused) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    setPosition({ x, y });
  };

  useEffect(() => {
    if (isFocused) {
      setOpacity(1);
    } else if (isHovered) {
      setOpacity(0.8);
    } else {
      setOpacity(0);
    }
  }, [isFocused, isHovered]);

  return (
    <div
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isFocused) setOpacity(0);
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Enhanced gradient glow effect */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
        style={{
          background: `radial-gradient(
            400px circle at ${position.x}px ${position.y}px,
            rgba(251, 191, 36, ${isFocused ? 0.4 : isHovered ? 0.25 : 0.15}),
            transparent 45%
          )`,
          opacity: isFocused ? 1 : isHovered ? 0.85 : 0.6,
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isFocused 
            ? '0 0 0 2px rgba(251, 191, 36, 0.5), 0 0 25px 3px rgba(251, 191, 36, 0.25)'
            : isHovered
            ? '0 0 0 1.5px rgba(251, 191, 36, 0.4), 0 0 20px 2px rgba(251, 191, 36, 0.2)'
            : '0 0 0 1px rgba(251, 191, 36, 0.2)',
          transform: 'translateZ(0)'
        }}
      />

      {/* Input */}
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none flex items-center">
          <Search className="h-5 w-5" />
          <span className="mx-3 text-amber-600/50">|</span>
        </div>
        
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          suppressHydrationWarning
          className="w-full h-12 pl-12 pr-4 text-amber-800 bg-white/90 hover:bg-amber-50 backdrop-blur-sm rounded-xl border border-amber-600/30 hover:border-amber-600/50 focus:border-amber-600/50 focus:outline-none focus:ring-0 transition-all duration-300 placeholder-amber-600/50 shadow-sm hover:shadow"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (!isHovered) setOpacity(0);
          }}
          {...props}
        />
      </div>
    </div>
  );
});

AnimatedGlowingSearchBar.displayName = 'AnimatedGlowingSearchBar';

export default AnimatedGlowingSearchBar;
