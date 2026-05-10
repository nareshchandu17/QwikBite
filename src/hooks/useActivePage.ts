'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useActivePage() {
  const pathname = usePathname();
  const [activePath, setActivePath] = useState(pathname);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  /**
   * Check if a given path is the currently active page
   * Supports exact matches and prefix matches
   */
  const isActive = (path: string, exact: boolean = false): boolean => {
    if (exact) {
      return activePath === path;
    }
    
    // For non-exact matches, check if current path starts with the given path
    if (path === '/') {
      return activePath === '/';
    }
    
    return activePath === path || activePath.startsWith(`${path}/`);
  };

  return {
    pathname: activePath,
    isActive,
  };
}
