'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Plus, Minus, ShoppingCart, Star, ChevronDown, Heart, Clock, WifiOff, Wifi } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';

// Import types and data
import { menuItems, categories, dietaryOptions, type MenuItem } from '@/data/menu';

// Import hooks
import { useSearch } from '@/context/SearchContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useCartStore } from '@/stores/cartStore';
import { useLoadingState } from '@/hooks/useLoadingState';
// WebSocket removed for serverless compatibility

// Import UI components
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import TimeSlotModal from '@/components/TimeSlotModal';
import AnimatedGlowingSearchBar from '@/components/ui/animated-glowing-search-bar';
import MenuSkeletonLoader from '@/components/MenuSkeletonLoader';
import { toast } from 'sonner';

// Categories for rotating text
const searchCategories = [
  'tiffins',
  'fastfoods',
  'curries',
  'drinks',
  'mocktails',
  'snacks',
  'tea corner'
];

// Styling constants with enhanced interactivity and glow effect
const premiumCardClasses = 'bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1 relative group h-full flex flex-col';

// Add global styles for the card glow effect
const cardGlowStyle = `
  .menu-card {
    position: relative;
    transition: all 0.3s ease;
  }
  
  .menu-card::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 1.25rem;
    background: linear-gradient(45deg, rgba(251, 191, 36, 0.3), rgba(249, 115, 22, 0.25), rgba(251, 191, 36, 0.3));
    background-size: 200% 200%;
    z-index: -1;
    opacity: 0;
    filter: blur(6px);
    transition: opacity 0.4s ease;
    pointer-events: none;
  }
  
  .menu-card:hover::after {
    opacity: 0.8;
    animation: gradientShift 4s ease infinite;
  }
  
  @keyframes gradientShift {
    0%, 100% { 
      background-position: 0% 50%; 
      opacity: 0.8;
    }
    50% { 
      background-position: 100% 50%;
      opacity: 0.9;
    }
  }
`;
const premiumButtonClasses = 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30';
const categoryButtonClasses = (isActive: boolean) =>
  `px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive
    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
  } whitespace-nowrap`;

export default function MenuPage() {
  // All hooks must be called in the same order every render
  
  // State hooks
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isBackgroundRefresh, setIsBackgroundRefresh] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState<string | null>(null);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { startLoading, stopLoading } = useLoadingState();
  const { items: cartItems, addItem: addToCart, removeItem: removeFromCart, clear } = useCartStore();
  const router = useRouter();
  const searchCtx = useSearch();
  // WebSocket removed
  const { toggleFavorite, isFavorite } = useFavorites();

  // Constants
  const itemsPerPage = 24; // 4 columns x 6 rows = 24 items
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  const selectedDietary = dietaryFilters;
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  
  // Add glow effect styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cardGlowStyle;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
    setIsMounted(true);
  }, []);

  // Set up scroll listener
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Categories for filtering
  const categoryOptions = [
    { id: 'all', name: 'All' },
    { id: 'Tiffins', name: 'Tiffins' },
    { id: 'Fast Food', name: 'Fast Food' },
    { id: 'Curries', name: 'Curries' },
    { id: 'Drinks', name: 'Drinks' },
    { id: 'Juices', name: 'Juices' },
    { id: 'Mocktails', name: 'Mocktails' },
    { id: 'Snacks', name: 'Snacks' },
    { id: 'Tea Corner', name: 'Tea Corner' }
  ];

  // Fetch initial menu items from API with fallback to local data
  const fetchMenuItems = useCallback(async (isBackgroundRefresh = false) => {
    // Case 1: First time user opens Menu page OR Case 4: Hard refresh
    if (isInitialLoad || !hasData) {
      setIsLoading(true);
      startLoading();
    } 
    // Case 3: Background refresh
    else if (isBackgroundRefresh) {
      setIsBackgroundRefresh(true);
    }
    // Case 2: User navigates back - data already exists, no loading needed
    else {
      return;
    }

    try {
      // Try server API first
      const res = await fetch('/api/menu?limit=200', { cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();

        const items = Array.isArray(data) ? data : data?.data || data?.items || [];
        if (items && items.length > 0) {
          setMenuItems(items);
          setFilteredItems(items);
          setHasData(true);
          return;
        }
      }

      // Fallback to local data if API fails or returns nothing
      const localMenuItems = (await import('@/data/menu')).menuItems;
      console.log('Loaded local menu items:', localMenuItems.length);
      setMenuItems(localMenuItems);
      setFilteredItems(localMenuItems);
      setHasData(true);

    } catch (error) {
      console.error('Error loading menu items:', error);
      // Fallback to local data on error
      try {
        const localMenuItems = (await import('@/data/menu')).menuItems;
        setMenuItems(localMenuItems);
        setFilteredItems(localMenuItems);
        setHasData(true);
      } catch (e) {
        console.error('Failed to load local menu items:', e);
      }
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
      setIsBackgroundRefresh(false);
      stopLoading();
    }
  }, [startLoading, stopLoading, isInitialLoad, hasData]);

  // Rotate categories in search placeholder and fetch menu items on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCategoryIndex((prev) => (prev + 1) % searchCategories.length);
    }, 3000); // Change every 3 seconds

    // Fetch menu items when component mounts
    fetchMenuItems();

    return () => clearInterval(interval);
  }, [fetchMenuItems]);


  // Menu update handlers with debouncing
  const handleMenuUpdate = debounce((data: MenuItem) => {
    setMenuItems(prev => {
      const exists = prev.some(item => item.id === data.id);
      return exists
        ? prev.map(item => item.id === data.id ? { ...item, ...data } : item)
        : [...prev, data];
    });
  }, 100);

  const handleMenuDelete = (data: { id: string }) => {
    setMenuItems(prev => prev.filter(item => item.id !== data.id));
  };

  // Connection status handlers - REMOVED
  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleReconnectAttempt = () => {
    console.log('Reconnecting...');
  };

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleMenuUpdate.cancel();
    };
  }, [handleScroll, handleMenuUpdate]);

  // Instant filter function
  const filterItems = useCallback(() => {
    if (!isMounted) return;

    try {
      // Create a copy of menu items
      let result = [...menuItems];

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(item =>
          item.name.toLowerCase().includes(query) ||
          (item.description?.toLowerCase() || '').includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (selectedCategory && selectedCategory !== 'all') {
        result = result.filter(item => item.category === selectedCategory);
      } else if (selectedCategory === 'all') {
        // Randomize items when "All" category is selected for better UX
        result = result.sort(() => Math.random() - 0.5);
      }

      // Apply dietary filters
      if (dietaryFilters && dietaryFilters.length > 0) {
        result = result.filter(item =>
          dietaryFilters.every(diet =>
            (diet === 'vegetarian' && item.isVegetarian) ||
            (diet === 'vegan' && item.isVegan) ||
            (diet === 'glutenFree' && item.isGlutenFree) ||
            (diet === 'dairyFree' && item.isDairyFree)
          )
        );
      }

      setFilteredItems(result);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error) {
      console.error('Error filtering items:', error);
    }
  }, [searchQuery, selectedCategory, dietaryFilters, isMounted, menuItems]);

  // Debugging: Log when menuItems or filteredItems change
  useEffect(() => {
    console.log('menuItems updated:', menuItems);
    console.log('filteredItems updated:', filteredItems);
    console.log('isLoading:', isLoading);
  }, [menuItems, filteredItems, isLoading]);

  // Call filterItems when filters change or component mounts
  useEffect(() => {
    if (menuItems.length > 0) {
      console.log('Filtering items...');
      filterItems();
    } else {
      console.log('No menu items to filter');
    }
  }, [filterItems, menuItems]);


  // Toggle favorite handler
  const handleToggleFavorite = async (itemId: string, itemType: string = 'menu') => {
    setIsFavoriteLoading(itemId);

    const wasFavorite = isFavorite(itemId);

    try {
      await toggleFavorite(itemId, itemType);

      // Show success toast using Sonner
      if (!wasFavorite) {
        toast.success('Added to favorites! ❤️', {
          description: 'This item has been added to your favorites list.',
          duration: 3000,
        });
      } else {
        toast('Removed from favorites', {
          description: 'This item has been removed from your favorites list.',
          duration: 3000,
        });
      }

      console.log(!wasFavorite ? 'Added to favorites!' : 'Removed from favorites!');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Show error toast using Sonner
      toast.error('Failed to update favorites', {
        description: 'Please try again.',
        duration: 5000,
      });
      
      // Re-throw the error to be caught by the error boundary
      throw error;
    } finally {
      setIsFavoriteLoading(null);
    }
  };

  // Add to cart handler
  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    console.log(`${item.name} has been added to your cart`);

    // Notify other clients about popular items (example - disabled for serverless)
    // if (item.isPopular) { ... }
  };

  // Buy now handler
  const handleBuyNow = (item: MenuItem) => {
    handleAddToCart(item);
    setSelectedItem(item);
    setIsTimeSlotModalOpen(true);
  };

  // Initialize search query from context if available
  useEffect(() => {
    if (searchCtx?.query) {
      setSearchQuery(searchCtx.query);
    }
  }, [searchCtx]);

  // Calculate total price
  const totalPrice = cart.reduce(
    (total: number, cartItem: { item: MenuItem; quantity: number }) => total + (cartItem.item.price * cartItem.quantity),
    0
  );

  // Toggle dietary filter


  // Handle page change with smooth scroll
  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 pt-20 pb-8"
      >
        {/* Time Slot Modal */}
        <TimeSlotModal
          isOpen={isTimeSlotModalOpen}
          onClose={() => setIsTimeSlotModalOpen(false)}
          item={selectedItem}
        />
      </motion.div>

      {/* Connection status indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`p-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white shadow-lg`}>
          {isConnected ? (
            <Wifi className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-8 px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-row items-center gap-4 w-full">
          {/* Animated Glowing Search Bar */}
          <div className="relative flex-1 max-w-2xl">
            <AnimatedGlowingSearchBar
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search for ${searchCategories[currentCategoryIndex]}...`}
              className="w-full"
            />
          </div>

          {/* Categories Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="h-12 px-4 border-amber-600/30 hover:border-amber-600/50 bg-white/90 hover:bg-amber-50 text-amber-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow w-36"
            >
              <Filter className="h-4 w-4" />
              <span className="font-medium">Categories</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Categories Dropdown Menu */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {categoryOptions.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${selectedCategory === category.id ? 'bg-amber-50 text-amber-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        role="menuitem"
                        suppressHydrationWarning
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Menu Items */}
      <div className="w-full">
        {(isInitialLoad || isLoading) ? (
          <MenuSkeletonLoader />
        ) : menuItems.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No menu items found</h3>
            <p className="mt-2 text-gray-500">Please try refreshing the page or check back later.</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-amber-500 hover:bg-amber-600"
            >
              Refresh Page
            </Button>
          </div>
        ) : (
          <>
            {isBackgroundRefresh && (
              <div className="flex items-center justify-center py-2 mb-4">
                <div className="flex items-center space-x-2 text-amber-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                  <span className="text-sm">Updating menu...</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-6 w-full px-4 sm:px-6 lg:px-8">
              {currentItems.map((item: MenuItem) => (
                <div
                  key={`menu-item-${item.id}`}
                  className={`${premiumCardClasses} menu-card ${!item.available ? 'opacity-70' : ''} hover:shadow-md h-full flex flex-col`}
                  style={{ minHeight: '300px', height: '100%' }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Use _id from DB if available, otherwise we can&apos;t favorite it in DB
                        const idToUse = item._id;
                        if (!idToUse) {
                          console.warn("Item cannot be favorited: Missing database ID (likely local data)");
                          return; // Do not attempt to toggle if no DB ID
                        }
                        await handleToggleFavorite(idToUse);
                      }}
                      disabled={!!(item._id && isFavoriteLoading === item._id)}
                      className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 ${item._id && isFavorite(item._id)
                        ? 'text-red-500 bg-white/90 hover:bg-red-100 scale-110'
                        : 'text-gray-700 bg-white/80 hover:bg-white hover:text-red-500'
                        } ${item._id && isFavoriteLoading === item._id ? 'opacity-70 cursor-wait' : ''}`}
                      title={item._id && isFavorite(item._id) ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label={item._id && isFavorite(item._id) ? 'Remove from favorites' : 'Add to favorites'}
                      suppressHydrationWarning
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${item._id && isFavorite(item._id) ? 'fill-current' : ''}`}
                        strokeWidth={item._id && isFavorite(item._id) ? 2 : 1.5}
                      />
                      {item._id && isFavorite(item._id) && (
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
                      )}
                    </button>

                    <div className="relative h-full w-full">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                        <p className="text-sm text-gray-500/90 mt-1 line-clamp-2 font-light">{item.description}</p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold text-gray-800">
                          ₹{item.price.toFixed(2)}
                        </span>
                        {item.originalPrice && (
                          <span className="ml-2 text-sm text-gray-400 line-through">
                            ₹{item.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        onClick={() => handleBuyNow(item)}
                        className="w-full py-3 px-4 font-medium transition-colors duration-200 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white hover:shadow-lg hover:shadow-amber-500/30 cursor-pointer"
                        suppressHydrationWarning
                      >
                        {item.available ? 'Order Now' : 'Sold Out'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 mb-8 flex flex-col items-center gap-4 w-full">
                <div>
                  <p className="text-sm text-gray-600">
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-amber-500 cursor-pointer"
                    suppressHydrationWarning
                  >
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-amber-500 cursor-pointer"
                    suppressHydrationWarning
                  >
                    Next
                  </Button>
                </div>

              </div>
            )}
            
            {currentItems.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No items found</h3>
                <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setDietaryFilters([]);
                  }}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white hover:bg-amber-600"
                  suppressHydrationWarning
                >
                  Reset all filters
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}


// Add custom scrollbar styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    
    /* Text selection */
    ::selection {
      background: rgba(245, 158, 11, 0.2);
      color: inherit;
    }
  `;
  document.head.appendChild(style);
}
