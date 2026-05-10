'use client';

import { useEffect } from 'react';
import { initializeDB } from '@/lib/initDB';

export default function DBInitializer() {
  useEffect(() => {
    // Initialize the database connection when the component mounts
    initializeDB().catch(console.error);
    
    // Cleanup function
    return () => {
      // Optional: Add any cleanup code here if needed
    };
  }, []);

  return null; // This component doesn&apos;t render anything
}
