'use client';

import { usePathname } from 'next/navigation';
import { PageType } from '@/lib/ai/types';

/**
 * Hook to detect current page context for AI assistant
 */
export function usePageContext(): {
    currentPage: PageType;
    route: string;
} {
    const pathname = usePathname();

    // Determine page type from pathname
    let currentPage: PageType = 'unknown';

    if (!pathname) {
        return {
            currentPage,
            route: '/'
        };
    }

    if (pathname.includes('/customer/menu') || pathname.includes('/menu')) {
        currentPage = 'menu';
    } else if (pathname.includes('/order-summary') || pathname.includes('/cart')) {
        currentPage = 'order-summary';
    } else if (pathname.includes('/live-status') || pathname.includes('/order-status')) {
        currentPage = 'live-status';
    } else if (pathname.includes('/feedback')) {
        currentPage = 'feedback';
    } else if (pathname.includes('/payment')) {
        currentPage = 'payment';
    } else if (pathname.includes('/admin')) {
        currentPage = 'admin';
    }

    return {
        currentPage,
        route: pathname
    };
}
