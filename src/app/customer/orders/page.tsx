"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { useOrders } from '@/context/OrderContext';
import QwikBiteEliteTracker from '@/components/orders/QwikBiteEliteTracker';
import { useCartStore } from '@/stores/cartStore';
import { OrderHistorySkeleton } from '@/components/OrderHistorySkeleton';
import { toast } from 'sonner';
import { menuItems } from '@/data/menu';

// --- Types ---
type OrderStatus = 'Preparing' | 'Delivered' | 'Cancelled' | 'Received';

interface OrderItem {
  id?: string | number;
  name: string;
  quantity: number;
  price?: number;
  description?: string;
  imageUrl?: string;
  image?: string;
}

interface Order {
  id: string;
  username: string;
  status: OrderStatus;
  statusText?: string;
  date: string;
  items: string | OrderItem[];
  price: string;
  imageUrl: string;
  originalPrice?: string;
  total: number;
  createdAt?: string;
  updatedAt?: string;
  paymentMethod?: string;
  progressStep?: number;
  slotTiming?: string;
  timeSlot?: string;
  pickupDate?: string;
  pickupLocation?: string;
  estimatedTime?: number;
}

type FilterType = 'All' | 'Active' | 'Completed' | 'Cancelled';

const getMenuImageForItem = (itemName: string): string | null => {
  const normalized = itemName?.toLowerCase().trim();
  if (!normalized) return null;

  // Try exact match first
  let menuItem = menuItems.find((item) => item.name.toLowerCase() === normalized);
  
  // If no exact match, try partial match
  if (!menuItem) {
    menuItem = menuItems.find((item) =>
      normalized.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(normalized)
    );
  }

  return menuItem?.image || null;
};

const getOrderItemImages = (order: Order): string[] => {
  // If items is a string, parse it to extract item names
  if (typeof order.items === 'string') {
    const itemNames = order.items.split(',').map(item => item.trim());
    
    const images = itemNames
      .map(itemStr => {
        // Extract name from "1x Item Name" format
        const match = itemStr.match(/(\d+)x\s*(.+)/);
        const itemName = match ? match[2] : itemStr;
        return getMenuImageForItem(itemName);
      })
      .filter((img): img is string => Boolean(img));
    
    return images.length > 0 ? images : ['/images/order.jpg'];
  }

  // If items is an array, get images from each item
  if (Array.isArray(order.items) && order.items.length > 0) {
    const resolvedImages = order.items
      .map((item) => {
        // Check if item has a real image (not placeholder)
        const hasRealImage = item.imageUrl && !item.imageUrl.includes('placeholder') && !item.imageUrl.includes('order.jpg');
        const hasRealImageField = item.image && !item.image.includes('placeholder') && !item.image.includes('order.jpg');
        
        // First try to match from menu (this is the real image)
        const menuImage = getMenuImageForItem(item.name);
        if (menuImage) {
          return menuImage;
        }
        
        // Only use item's own image if it's not a placeholder
        if (hasRealImage) {
          return item.imageUrl;
        }
        if (hasRealImageField) {
          return item.image;
        }
        
        return null;
      })
      .filter((src): src is string => Boolean(src));

    if (resolvedImages.length > 0) {
      return Array.from(new Set(resolvedImages));
    }
  }

  // Fallback to order's imageUrl or default
  return [order.imageUrl || '/images/order.jpg'];
};

// --- Sub-Components ---

const StatsCard: React.FC = () => {
  return (
    <div className="w-full bg-amber-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-amber-100 dark:border-gray-700 flex items-center justify-between shadow-sm h-24">
      <div className="flex items-center gap-4 h-full">
        <div className="p-2 bg-[#f9f506]/20 rounded-full text-amber-700 dark:text-[#f9f506] shrink-0">
          <span className="material-symbols-outlined text-2xl">stars</span>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-gray-900 dark:text-white font-bold text-base md:text-lg leading-tight">you&apos;re 2 orders away from a free meal!</p>
          <p className="text-amber-700 dark:text-[#f9f506] text-sm font-bold uppercase tracking-wider mt-0.5">Loyalty Level: Gold Member</p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-1/3 min-w-[200px] pl-4">
        <div className="relative h-3 w-full rounded-full bg-white dark:bg-gray-700 overflow-hidden shadow-inner ring-1 ring-black/5">
          <div className="absolute top-0 left-0 h-full rounded-full bg-[#f9f506]" style={{ width: '80%' }}></div>
        </div>
        <span className="text-amber-800 dark:text-[#f9f506] font-bold text-base whitespace-nowrap">80%</span>
      </div>
    </div>
  );
};

const OrderFilters: React.FC<{ currentFilter: FilterType; onFilterChange: (filter: FilterType) => void }> = ({ currentFilter, onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const filters: { type: FilterType; icon: string; label: string }[] = [
    { type: 'All', icon: 'inventory_2', label: 'All' },
    { type: 'Active', icon: 'schedule', label: 'Active' },
    { type: 'Completed', icon: 'check_circle', label: 'Completed' },
    { type: 'Cancelled', icon: 'cancel', label: 'Cancelled' },
  ];

  return (
    <section className="w-full flex flex-row items-center gap-4 z-10 px-0">
      {/* Search Bar - Reduced width */}
      <div className="flex-1 max-w-md">
        <label className="relative flex w-full items-center">
          <span className="absolute left-4 text-gray-400 transition-all duration-300">
            <span className="material-symbols-outlined text-[22px]">
              search
            </span>
          </span>

          <input
            suppressHydrationWarning
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full h-12 rounded-full
              bg-white/80 backdrop-blur-md
              border border-gray-200/70
              shadow-[0_8px_30px_rgba(0,0,0,0.06)]
              hover:shadow-[0_10px_35px_rgba(0,0,0,0.08)]
              focus:shadow-[0_12px_40px_rgba(249,245,6,0.25)]
              focus:border-[#f9f506]
              focus:ring-4 focus:ring-[#f9f506]/20
              transition-all duration-300
              text-base text-gray-800
              placeholder:text-gray-400
              outline-none
              pl-16 pr-10
              dark:bg-gray-900/60
              dark:border-gray-700
              dark:text-white
            "
            placeholder="Search by item, order ID, or date…"
            type="text"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              type="button"
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </label>

      </div>

      {/* Filter Buttons - With text labels and consistent height */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 flex-nowrap">
          {filters.map((filter) => {
            const isActive = currentFilter === filter.type;
            const activeClasses = "bg-amber-100 text-amber-700 shadow-sm dark:bg-[#f9f506] dark:text-black";
            const inactiveClasses = "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white";

            return (
              <button
                key={filter.type}
                onClick={() => onFilterChange(filter.type)}
                suppressHydrationWarning
                className={`flex items-center gap-2 px-4 py-2.5 h-12 rounded-full font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${isActive ? activeClasses : inactiveClasses}`}
              >
                <span className="material-symbols-outlined text-[18px]">{filter.icon}</span>
                <span className="font-medium">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const OrderCard: React.FC<{
  order: Order;
  onTrackOrder: (order: Order) => void;
  onReorder: (order: Order) => void;
  isReordering?: boolean;
}> = ({ order, onTrackOrder, onReorder, isReordering }) => {
  const router = useRouter();
  const isCancelled = order.status.toLowerCase().includes('cancelled');
  const isDelivered = order.status.toLowerCase().includes('delivered');
  const isPreparing = order.status.toLowerCase().includes('preparing') || order.status.toLowerCase().includes('ready') || order.status.toLowerCase().includes('pending');
  const statusBadgeClass = isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : isDelivered ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

  const handleDownloadInvoice = async (event: React.MouseEvent<HTMLButtonElement>, orderId: string) => {
    const button = event.currentTarget;
    const originalContent = button.innerHTML;

    try {
      // Show loading state
      button.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Generating...';
      button.disabled = true;

      // Open invoice in new tab
      const invoiceWindow = window.open(`/api/customer/orders/${orderId}/invoice`, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

      if (!invoiceWindow) {
        throw new Error('Failed to open invoice window');
      }

      // Show success message
      button.innerHTML = '<span class="material-symbols-outlined">check</span> Opened';
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Error opening invoice:', error);
      button.innerHTML = '<span class="material-symbols-outlined">error</span> Error';
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
      }, 2000);
    }
  };

  return (
    <article className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 p-4 transition-all duration-300 transform hover:-translate-y-1 w-full relative min-h-[140px] ${isCancelled ? 'opacity-75 hover:opacity-100' : ''}`}>
      {/* Status Indicator - Top Right */}
      {isPreparing && (
        <div className="absolute top-4 right-4 z-10">
          <div className="dark:bg-gray-800/90 backdrop-blur-sm p-3 shadow-sm">
            <div className="flex items-center gap-2">
              {[
                { label: 'Placed', icon: 'receipt_long' },
                { label: 'Cooking', icon: 'skillet', active: true },
                { label: 'Delivery', icon: 'local_shipping' },
                { label: 'Done', icon: 'check' }
              ].map((step, idx) => {
                const stepActive = order.progressStep === idx;
                const stepPast = (order.progressStep ?? -1) > idx;

                let circleClass = "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
                let containerClass = "opacity-30";
                let labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400";

                if (stepActive) {
                  circleClass = "bg-[#f9f506] text-black shadow-lg shadow-[#f9f506]/30 animate-pulse";
                  containerClass = "";
                  labelClass = "text-xs font-bold text-black dark:text-[#f9f506]";
                } else if (stepPast) {
                  containerClass = "opacity-50";
                }

                return (
                  <React.Fragment key={step.label}>
                    <div className={`${containerClass} flex flex-col items-center gap-1 min-w-10`}>
                      <div className={`size-7 rounded-full flex items-center justify-center ${circleClass}`}>
                        <span className="material-symbols-outlined text-sm">{step.icon}</span>
                      </div>
                      <span className={labelClass}>{step.label}</span>
                    </div>
                    {idx < 3 && (
                      <div className={`flex items-center ${containerClass}`}>
                        <span className="text-gray-400 dark:text-gray-600 text-lg font-bold">--</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-green-600 dark:text-green-400 bg-white/90 dark:bg-green-900/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm border border-green-100 dark:border-green-800">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Delivered Successfully</span>
        </div>
      )}

      {isCancelled && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-red-600 dark:text-red-400 bg-white/90 dark:bg-red-900/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm border border-red-100 dark:border-red-800">
          <span className="material-symbols-outlined text-base">error</span>
          <span>Order Cancelled</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Main Content */}
        <div className="flex gap-4 flex-1">
          <div className="shrink-0 relative">
            <div className="flex items-center gap-2">
              {getOrderItemImages(order).slice(0, 3).map((imageSrc, index) => (
                <div key={`${order.id}-${index}`} className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shadow-sm">
                  <img
                    alt={`${order.username} meal ${index + 1}`}
                    className={`w-full h-full object-cover ${isCancelled ? 'grayscale' : 'grayscale group-hover:grayscale-0 transition-all duration-500'}`}
                    src={imageSrc}
                    onError={(e) => {
                      e.currentTarget.src = '/images/order.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between py-0 flex-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{order.username}</h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadgeClass}`}>
                  {order.statusText || order.status}
                </span>
              </div>
              <p className="text-base text-gray-500 dark:text-gray-400">Order #{order.id} • {order.date}</p>
              <p className="text-gray-700 dark:text-gray-300 text-base font-medium line-clamp-2">
                {Array.isArray(order.items)
                  ? order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')
                  : order.items
                }
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Price and Buttons */}
        <div className="flex items-center justify-between pt-2">
          {/* Price - Bottom Left */}
          <p className={`text-lg font-bold ${isCancelled ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
            ₹{(order.total && order.total > 0) ? order.total.toFixed(2) : (order.price ? parseFloat(order.price.replace(/[^0-9.]/g, '')).toFixed(2) : '0.00')}
          </p>

          {/* Buttons - Bottom Right */}
          <div className="flex flex-wrap items-center gap-2">
            {isPreparing && (
              <>
                <button
                  suppressHydrationWarning
                  onClick={(e) => handleDownloadInvoice(e, order.id)}
                  className="h-10 px-5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  Invoice
                </button>
                <button
                  suppressHydrationWarning
                  onClick={() => onTrackOrder(order)}
                  className="h-10 px-6 rounded-full bg-[#f9f506] text-black font-bold text-sm shadow-md shadow-[#f9f506]/20 hover:shadow-lg hover:shadow-[#f9f506]/40 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  Track Order
                </button>
              </>
            )}

            {isDelivered && (
              <>
                <button
                  suppressHydrationWarning
                  onClick={(e) => handleDownloadInvoice(e, order.id)}
                  className="h-10 px-5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  Invoice
                </button>
                <button
                  suppressHydrationWarning
                  onClick={() => router.push('/customer/feedback')}
                  className="h-10 px-5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                >
                  <span className="material-symbols-outlined text-[18px]">star</span>
                  Rate
                </button>
                <button
                  onClick={() => onReorder(order)}
                  disabled={isReordering}
                  suppressHydrationWarning
                  className={`h-10 px-6 rounded-full bg-green-600 text-white hover:bg-green-700 font-bold text-sm shadow-md shadow-green-600/20 hover:shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer ${isReordering ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isReordering ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                  )}
                  {isReordering ? 'Reordering...' : 'Reorder'}
                </button>
              </>
            )}

            {isCancelled && (
              <button
                suppressHydrationWarning
                className="h-10 px-5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              >
                <span className="material-symbols-outlined text-[18px]">help</span>
                Help
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

// --- Pagination Component ---
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const getVisiblePages = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages === 0) return null;

  console.log('Pagination Component Rendering:', { totalPages, currentPage, totalItems });

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} orders
      </div>

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            page === -1 ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 dark:text-gray-600">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${currentPage === page
                  ? 'bg-[#f9f506] text-black shadow-lg shadow-[#f9f506]/30'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          Next
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---

const OrdersPage = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isReorderingId, setIsReorderingId] = useState<string | null>(null);
  const ORDERS_PER_PAGE = 14;
  const { orders, addOrder } = useOrders();
  const { addItem: addToCart } = useCartStore();

  // Simplified loading logic
  useEffect(() => {
    // Set loading to false if we have orders
    if (orders.length > 0) {
      setIsLoading(false);
    }
  }, [orders]);

  // Also add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('[OrdersPage] Timeout reached, setting isLoading to false');
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Derive selected order from live orders list
  const selectedOrder = useMemo(() => {
    return orders.find(order => order.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (filter === 'All') return orders;
    if (filter === 'Active') return orders.filter((order: Order) => order.status === 'Preparing');
    if (filter === 'Completed') return orders.filter((order: Order) => order.status === 'Delivered');
    if (filter === 'Cancelled') return orders.filter((order: Order) => order.status === 'Cancelled');
    return orders;
  }, [filter, orders]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Debug logging
  // Pagination Debug logs removed for production

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleCloseModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  const handleTrackOrder = (order: Order) => {
    console.log('Track order clicked:', order);
    setSelectedOrderId(order.id);
    setIsModalOpen(true);
    console.log('Modal state set to open, isModalOpen:', true);
  };

  const handleReorder = async (order: Order) => {
    if (isReorderingId) return;

    setIsReorderingId(order.id);
    const reorderToast = toast.loading("Processing your reorder...");

    try {
      let itemsArray: any[] = [];

      if (Array.isArray(order.items)) {
        itemsArray = order.items;
      } else if (typeof order.items === 'string') {
        // Parse "1x Item Name, 2x Another Item"
        const parts = order.items.split(',').map(s => s.trim());
        itemsArray = parts.map(part => {
          const match = part.match(/(\d+)x\s*(.+)/);
          if (match) {
            return {
              quantity: parseInt(match[1]),
              name: match[2],
              id: `reorder-${match[2]}`,
              price: 0 // Will be handled by backend or shown as 0 if unknown
            };
          }
          return null;
        }).filter(Boolean);
      }

      if (itemsArray.length === 0) {
        toast.error("Could not find items to reorder", { id: reorderToast });
        setIsReorderingId(null);
        return;
      }

      // One-Click: Call addOrder directly
      const newOrderId = await addOrder({
        username: order.username,
        status: 'Preparing',
        items: itemsArray.map(it => `${it.quantity}x ${it.name}`).join(', '),
        itemsArray: itemsArray,
        price: order.price,
        total: order.total,
        imageUrl: order.imageUrl,
        timeSlot: 'ASAP',
        paymentMethod: 'Cash at Counter'
      });

      toast.success("Order placed successfully!", {
        id: reorderToast,
        description: `Your new order ${newOrderId} is now being prepared.`,
        action: {
          label: "Track",
          onClick: () => handleTrackOrder({ ...order, id: newOrderId, status: 'Preparing' })
        }
      });
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error("Failed to reorder. Please try again.", { id: reorderToast });
    } finally {
      setIsReorderingId(null);
    }
  };

  // Helper function to convert timeslot ID to display time
  const getDisplayTimeFromSlot = (slotId: string | null | undefined, orderDate?: string, orderId?: string): string => {
    if (slotId && slotId !== 'ASAP') {
      // Parse slot ID like "m-8-45" to get hour and minute
      const parts = slotId.split('-');
      if (parts.length >= 3) {
        const hour = parseInt(parts[1]);
        const minute = parseInt(parts[2]);

        // Convert to 12-hour format
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        const displayMinute = minute.toString().padStart(2, '0');

        return `${displayHour}:${displayMinute} ${period}`;
      }
    }

    // Generate realistic timeslot from order date if no timeslot field exists
    if (orderDate) {
      const orderDateTime = new Date(orderDate);

      // Use order ID to generate consistent but different times for different orders
      const orderIdHash = orderId ? orderId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
      const minutesOffset = (orderIdHash % 240); // 0-4 hours range based on order ID

      const slotTime = new Date(orderDateTime.getTime() + minutesOffset * 60000);

      const hour = slotTime.getHours();
      const minute = slotTime.getMinutes();

      // Round to nearest 15-minute interval
      const roundedMinute = Math.round(minute / 15) * 15;
      const adjustedHour = roundedMinute === 60 ? hour + 1 : hour;
      const finalMinute = roundedMinute === 60 ? 0 : roundedMinute;

      const period = adjustedHour >= 12 ? 'PM' : 'AM';
      const displayHour = adjustedHour > 12 ? adjustedHour - 12 : (adjustedHour === 0 ? 12 : adjustedHour);
      const displayMinute = finalMinute.toString().padStart(2, '0');

      return `${displayHour}:${displayMinute} ${period}`;
    }

    return 'ASAP';
  };

  // Map local Order type to tracker Order type
  const mapToTrackerOrder = (order: Order) => {
    const displayTime = getDisplayTimeFromSlot(order.timeSlot, order.date, order.id);

    const statusLower = order.status.toLowerCase();
    let mappedStatus: 'ordered' | 'preparing' | 'ready' | 'picked_up' | 'delivered';

    if (statusLower === 'preparing') {
      mappedStatus = 'preparing';
    } else if (statusLower === 'delivered') {
      mappedStatus = 'delivered';
    } else if (statusLower === 'ready' || statusLower === 'ready for pickup') {
      mappedStatus = 'ready';
    } else if (statusLower === 'picked up') {
      mappedStatus = 'picked_up';
    } else {
      mappedStatus = 'ordered';
    }

    // Process items to ensure they have imageUrl field
    let processedItems: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      description?: string;
      imageUrl?: string;
    }> = [];

    if (typeof order.items === 'string' && order.items.trim()) {
      // Parse items from string format like "1x Lemon Tea"
      const itemString = order.items.trim();
      const quantityMatch = itemString.match(/^(\d+)x\s+(.+)$/);

      if (quantityMatch) {
        const quantity = parseInt(quantityMatch[1]);
        const itemName = quantityMatch[2].trim();

        processedItems = [{
          id: `item-0`,
          name: itemName,
          quantity: quantity,
          price: order.price ? parseFloat(order.price.replace('$', '')) / quantity : 0,
          description: '',
          imageUrl: order.imageUrl || undefined
        }];
      } else {
        // Fallback for other formats
        processedItems = [{
          id: `item-0`,
          name: itemString,
          quantity: 1,
          price: order.price ? parseFloat(order.price.replace('$', '')) : 0,
          description: '',
          imageUrl: order.imageUrl || undefined
        }];
      }
    } else if (Array.isArray(order.items)) {
      processedItems = order.items.map((item, index) => {
        console.log(`Processing item ${index}:`, item);
        return {
          id: String(item.id ?? `item-${index}`),
          name: item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
          description: item.description,
          imageUrl: item.imageUrl || item.image || undefined // Use undefined instead of null
        };
      });
    }

    // Calculate total from items if not provided
    let calculatedTotal = 0;
    if (order.total && typeof order.total === 'number') {
      calculatedTotal = order.total;
    } else if (order.price && typeof order.price === 'string') {
      calculatedTotal = parseFloat(order.price.replace('$', ''));
    } else if (processedItems.length > 0) {
      // Calculate total from processed items
      calculatedTotal = processedItems.reduce((sum: number, item: any) => {
        const itemPrice = Number(item.price) || 0;
        const itemQuantity = item.quantity || 1;
        return sum + (itemPrice * itemQuantity);
      }, 0);
    }

    const mappedOrder = {
      id: order.id,
      items: processedItems,
      total: calculatedTotal,
      status: mappedStatus,
      createdAt: order.createdAt || new Date(order.date).toISOString(),
      paymentMethod: order.paymentMethod,
      pickupLocation: 'Main Counter',
      estimatedTime: 15,
      slotTiming: getDisplayTimeFromSlot(order.timeSlot, order.date, order.id),
      timeSlot: getDisplayTimeFromSlot(order.timeSlot, order.date, order.id),
      pickupDate: order.date
    };

    return mappedOrder;
  };

  return (
    <main className="flex-1 flex flex-col items-center w-full px-4 pt-16 pb-8 md:px-8 lg:px-4">
      <div className="w-full max-w-[1200px] flex flex-col gap-10">
        <section className="flex flex-col gap-8 px-0">
          <div className="flex flex-col gap-1 text-left md:text-left">
            <h1 className="text-gray-900 dark:text-white tracking-tight text-2xl md:text-4xl font-bold leading-tight">
              👋 Welcome back!
            </h1>
            <h1 className="text-gray-900 dark:text-white tracking-tight text-2xl md:text-4xl font-bold leading-tight">
              Here are your recent orders
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-normal">Track your delivery, reorder favorites, and view your history.</p>
          </div>
          <StatsCard />
        </section>

        <OrderFilters currentFilter={filter} onFilterChange={setFilter} />

        <div className="flex flex-col gap-8 px-0 pb-20">
          {isLoading ? (
            <div className="w-full py-8">
              <OrderHistorySkeleton />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
              <div className="w-48 h-48 bg-gray-50 rounded-full flex items-center justify-center mb-4 dark:bg-gray-800">
                <span className="material-symbols-outlined text-gray-300 text-6xl dark:text-gray-600">no_meals</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No orders found 🍽</h3>
                <p className="text-gray-500 dark:text-gray-400 text-base">Try changing your filter or browse top restaurants near you!</p>
              </div>
              <Link
                href="/customer/menu"
                className="h-12 px-8 rounded-full bg-[#f9f506] text-black font-bold text-base shadow-lg shadow-[#f9f506]/30 hover:shadow-[#f9f506]/50 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                Browse Menu
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {currentOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrackOrder={handleTrackOrder}
                  onReorder={handleReorder}
                  isReordering={isReorderingId === order.id}
                />
              ))}

              {/* Pagination Component */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredOrders.length}
                itemsPerPage={ORDERS_PER_PAGE}
              />
            </div>
          )}
        </div>
      </div>

      {/* Order Tracker Modal */}
      {selectedOrder && (
        <>
          {console.log('Rendering modal for order:', selectedOrder, 'isModalOpen:', isModalOpen)}
          <QwikBiteEliteTracker
            order={mapToTrackerOrder(selectedOrder)}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        </>
      )}
    </main>
  );
};

export default OrdersPage;
