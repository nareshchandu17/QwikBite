'use client';

import { usePathname } from 'next/navigation';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function ConditionalFAQAndFooter() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  if (!isHomePage) {
    return null;
  }
  
  return (
    <div className="flex-shrink-0 w-full">
      <FAQ />
      <Footer />
    </div>
  );
}