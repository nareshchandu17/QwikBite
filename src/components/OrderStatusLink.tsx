'use client';

import { ListOrdered } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';

export default function OrderStatusLink() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { openModal } = useAuthModal();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      // If not authenticated, open sign in modal and redirect after sign in
      openModal('signin', '/order-status/latest');
      return;
    }
    
    try {
      // Redirect directly to the latest order status page
      // The server will handle fetching the latest order
      window.location.href = '/order-status/latest';
    } catch (error) {
      console.error('Error navigating to order status:', error);
      // Fallback to orders page if there's an error
      window.location.href = '/orders';
    }
  };

  return (
    <div className="relative p-0.5">
      <button
        onClick={handleClick}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400"
        aria-label="Check current order status"
      >
        <ListOrdered className="h-5 w-5" />
        <span className="invisible absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
          Check Order Status
        </span>
      </button>
    </div>
  );
}
