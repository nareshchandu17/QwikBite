'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Heart, HeartOff, Star, ShoppingCart, Search, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { useFavorites } from '@/context/FavoritesContext';
import { menuItems as localMenuItems, type MenuItem } from '@/data/menu';
import TimeSlotModal from '@/components/TimeSlotModal';
import { useCustomerGuard } from '@/hooks/use-customer-guard';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoadingState } from '@/hooks/useLoadingState';
import { Skeleton } from '@/components/ui/skeleton';

interface FavouriteItem {
  id: string;
  name: string;
  image: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  tags: string[];
  originalPrice?: number;
  calories: number;  // Made required to match MenuItem
  available: boolean;  // Made required to match MenuItem
  isPopular?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
}

// Mock data - replace with your actual data fetching logic
const mockFavourites: FavouriteItem[] = [
  {
    id: '1',
    name: 'Masala Dosa',
    image: '/images/dishes/dosa.jpg',
    description: 'Crispy rice crepe with spiced potato filling',
    price: 120,
    category: 'Tiffins',
    rating: 4.5,
    tags: ['Vegetarian', 'Popular'],
    originalPrice: 140,
    calories: 320,
    available: true,
    isVegetarian: true,
    isPopular: true
  },
  {
    id: '2',
    name: 'Paneer Butter Masala',
    image: '/images/dishes/paneer-butter-masala.jpg',
    description: 'Cottage cheese in rich tomato and butter gravy',
    price: 220,
    category: 'Main Course',
    rating: 4.7,
    tags: ['Vegetarian', 'Popular'],
    calories: 450,
    available: true,
    isVegetarian: true,
    isGlutenFree: true
  },
  {
    id: '3',
    name: 'Chicken Biryani',
    image: '/images/dishes/chicken-biryani.jpg',
    description: 'Aromatic basmati rice with tender chicken pieces',
    price: 280,
    category: 'Main Course',
    rating: 4.8,
    tags: ['Non-Veg', 'Spicy'],
    calories: 520,
    available: true
  }
];

// Styling constants with enhanced interactivity and glow effect
const premiumCardClasses = 'bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1 relative group h-full flex flex-col menu-card';
const premiumButtonClasses = 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30';

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

export default function FavouritesPage() {
  const normalizeFavoriteId = (value: unknown): string | null => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return null;
  };

  const extractMenuItemsFromResponse = (payload: any): MenuItem[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  // Authentication and state management
  const { isAuthenticated, loading: authLoading } = useCustomerGuard();
  const {
    favorites,
    toggleFavorite,
    isFavorite,
    loading: favoritesLoading,
    error: favoritesError,
    fetchFavorites
  } = useFavorites();

  // Component state
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredFavourites, setFilteredFavourites] = useState<FavouriteItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FavouriteItem | null>(null);

  // State for all menu items (fetched from API + local fallback)
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);

  // Refs and hooks
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const addItem = useCartStore(state => state.addItem);
  const router = useRouter();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Loading state handlers
  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  // Fetch menu items on mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await fetch('/api/menu?limit=200');
        if (res.ok) {
          const data = await res.json();
          const items = extractMenuItemsFromResponse(data);
          if (items.length > 0) {
            setAllMenuItems(items);
            return;
          }
        }
        // Fallback
        setAllMenuItems(localMenuItems);
      } catch (e) {
        console.error("Failed to fetch menu items", e);
        setAllMenuItems(localMenuItems);
      }
    };
    fetchMenuItems();
  }, []);

  // NOTE: FavoritesContext already fetches favorites on mount.
  // Calling fetchFavorites() here again would cause a duplicate API request.
  // The context's favorites state is the source of truth — no extra fetch needed.

  // Set isClient to true after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);

    // Clean up any browser-specific attributes that might cause hydration mismatches
    const cleanupAttributes = () => {
      document.querySelectorAll('input, button, a, select, textarea').forEach(el => {
        el.removeAttribute('fdprocessedid');
      });
    };

    // Run cleanup after a short delay to ensure all browser processing is done
    const timer = setTimeout(cleanupAttributes, 100);
    return () => clearTimeout(timer);
  }, []);

  // State for favorites data and loading states
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Handle favorite toggle with loading state
  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const normalizedId = normalizeFavoriteId(id);
    if (!normalizedId) {
      console.warn('[Favorites] Attempted toggle with invalid item id:', id);
      return;
    }

    try {
      setIsFavoriteLoading(id);
      // FavoritesContext.toggleFavorite is the single source of toast notifications.
      // Do NOT call toast() here — the context handles success & error toasts.
      await toggleFavorite(normalizedId);
    } catch (error) {
      // Context already shows an error toast; just log here.
      console.error('[Favorites] Error toggling favorite:', error);
    } finally {
      setIsFavoriteLoading(null);
    }
  };

  // Handle opening time slot modal for buy now
  const handleBuyNow = (item: FavouriteItem, e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setSelectedItem(item);
    setIsTimeSlotModalOpen(true);
  };

  // Handle adding item to cart (kept for other components that might use it)
  const handleAddToCart = (item: FavouriteItem, e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image
      });
      toast.success(`${item.name} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  // Initialize filtered items and set up scroll listener
  useEffect(() => {
    setIsMounted(true);

    // Set up scroll listener for header effects
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load favorites when component mounts or menu items change
  useEffect(() => {
    // Wait for everything to be ready
    if (favoritesLoading || !isMounted || allMenuItems.length === 0) return;

    const favoriteItems = allMenuItems
      .filter((item): item is MenuItem & { id: string } => {
        if (!item) return false;
        
        // Resolve ID similarly to how menu/page.tsx does it
        const dbId = normalizeFavoriteId(item._id) || normalizeFavoriteId(item.id);

        return dbId !== null && favorites.includes(dbId);
      })
      .map(item => {
        // Resolve ID similarly
        const itemId = normalizeFavoriteId(item._id) || normalizeFavoriteId(item.id) || '';

        return {
          id: itemId,
          name: item.name,
          image: item.image,
          description: item.description || '',
          price: item.price,
          category: item.category,
          rating: item.rating || 4.5,
          tags: item.tags || [],
          originalPrice: item.originalPrice,
          calories: item.calories,
          available: item.available,
          isPopular: item.isPopular,
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          isGlutenFree: item.isGlutenFree,
          isDairyFree: item.isDairyFree
        } as FavouriteItem;
      });

    setFavourites(favoriteItems);
    setFilteredFavourites(favoriteItems);

    // Cleanup function
    return () => {
      // Remove any added styles when component unmounts
      const styleElement = document.querySelector('style[data-favorites-style]');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [favorites, favoritesLoading, isMounted, allMenuItems]); // Added allMenuItems dependency

  // Set up scroll listener and glow effect styles
  useEffect(() => {
    // Mark component as mounted
    setIsMounted(true);

    // Add glow effect styles
    const style = document.createElement('style');
    style.setAttribute('data-favorites-style', 'true');
    style.textContent = cardGlowStyle;
    document.head.appendChild(style);

    // Set up scroll listener for header effects
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      // Only remove the style element if it still exists in the document
      if (style && style.parentNode === document.head) {
        document.head.removeChild(style);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);





  // Apply search and filters
  useEffect(() => {
    if (!isMounted) return;

    const applyFilters = () => {
      let result = [...favourites];

      // Apply search filter
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        result = result.filter(item =>
          item.name.toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.tags || []).some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply category filter
      if (selectedCategory !== 'all') {
        result = result.filter(item => item.category === selectedCategory);
      }

      setFilteredFavourites(result);
      setCurrentPage(1); // Reset to first page when filters change
    };

    startLoading();
    const timer = setTimeout(() => {
      applyFilters();
      stopLoading();
    }, 200);

    return () => clearTimeout(timer);
  }, [favourites, debouncedSearchQuery, isMounted, startLoading, stopLoading]);

  // NOTE: removeFromFavourites is intentionally not used in the JSX.
  // The heart button's onClick calls handleToggleFavorite directly, which
  // delegates to FavoritesContext — the single source of toast notifications.
  // Keeping this function would produce duplicate toasts.
  //
  // If you need a named removal handler, use handleToggleFavorite(id) instead.


  // Pagination
  const itemsPerPage = 24; // 4 columns x 6 rows
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFavourites.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFavourites.length / itemsPerPage);

  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (filteredFavourites.length === 0 && searchQuery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-amber-500 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No results found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn&apos;t find any items matching &quot;{searchQuery}&quot;
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              searchInputRef.current?.focus();
            }}
            className="px-6 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
          >
            Clear search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white overflow-x-hidden">
      <div className="w-full min-h-screen">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {/* Hero Section */}
            <div className="relative z-10 text-center">
              <motion.h1
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Your Favourite Meals <span className="inline-block animate-bounce">🌟</span>
              </motion.h1>
              <motion.p
                className="text-gray-600 max-w-2xl mx-auto text-lg mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                All your loved dishes in one place
              </motion.p>

              {/* Search and Filter Bar */}
              <div className="w-full max-w-4xl mx-auto space-y-4">
                <div className="relative w-full max-w-2xl mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-amber-500" />
                  </div>
                  <input
                    ref={(el) => {
                      if (el) {
                        searchInputRef.current = el;
                        // Remove any browser-specific attributes that might cause hydration issues
                        if (isClient) {
                          el.removeAttribute('fdprocessedid');
                        }
                      }
                    }}
                    type="text"
                    placeholder="Search your favourites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    suppressHydrationWarning={true}
                    className="block w-full pl-12 pr-12 py-3 rounded-full bg-white/80 border border-amber-100 text-gray-900 placeholder-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm shadow-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Add padding here */}
          <div className="h-8"></div>

          {/* Favourites Grid */}
          {(favoritesLoading || isLoading) ? (
            <FavoritesSkeleton />
          ) : filteredFavourites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl mx-auto px-4">
              <AnimatePresence mode="popLayout">
                {currentItems.map((item, index) => (
                  <motion.div
                    key={`favorite-item-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.2 } }}
                    layout
                    transition={{ duration: 0.3 }}
                    className={`${premiumCardClasses} hover:shadow-md`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <motion.button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleToggleFavorite(item.id, e);
                        }}
                        disabled={isFavoriteLoading === item.id}
                        className={`absolute top-3 right-3 z-10 p-2.5 rounded-full shadow-sm transition-colors duration-200 ${isFavorite(item.id)
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-white/90 text-gray-400 hover:text-red-400 hover:bg-white'
                          } ${isFavoriteLoading === item.id ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                        title={isFavorite(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                        aria-label={isFavorite(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                        whileTap={{ scale: 0.80 }}
                        whileHover={{ scale: 1.18 }}
                        animate={isFavoriteLoading !== item.id
                          ? { scale: isFavorite(item.id) ? 1.08 : 1 }
                          : { scale: 1 }
                        }
                        transition={{
                          type: 'spring',
                          stiffness: 450,
                          damping: 15,
                          mass: 0.8,
                        }}
                      >
                        <motion.div
                          animate={{ scale: isFavorite(item.id) ? 1 : 0.95 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Heart
                            className={`h-5 w-5 transition-all duration-200 ${isFavorite(item.id)
                              ? 'fill-red-500 text-red-500 drop-shadow-sm'
                              : 'fill-transparent text-gray-400'}`}
                            strokeWidth={isFavorite(item.id) ? 0 : 1.75}
                          />
                        </motion.div>
                        {/* Pulse ring on active state */}
                        {isFavorite(item.id) && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-red-400"
                            initial={{ scale: 0.8, opacity: 0.4 }}
                            animate={{ scale: 1.6, opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        )}
                      </motion.button>

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
                        <button
                          onClick={(e) => handleBuyNow(item, e)}
                          className="w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white hover:shadow-lg hover:shadow-amber-500/30 cursor-pointer"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {Math.ceil(filteredFavourites.length / itemsPerPage) > 1 && (
                <div className="mt-8 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyFavourites />
          )}
        </div>
      </div>
      
      {/* Time Slot Modal */}
      {selectedItem && (
        <TimeSlotModal
          isOpen={isTimeSlotModalOpen}
          onClose={() => setIsTimeSlotModalOpen(false)}
          item={{
            id: selectedItem.id,
            name: selectedItem.name,
            price: selectedItem.price,
            image: selectedItem.image,
            quantity: 1
          }}
        />
      )}
    </div>
  );
}

function EmptyFavourites() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative text-center py-20 px-4"
    >
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-100/30 rounded-full filter blur-3xl"></div>

      <div className="relative z-10 max-w-md mx-auto">
        <motion.div
          className="relative w-40 h-40 mx-auto mb-8"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 6,
            ease: "easeInOut",
            repeatType: "reverse"
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shadow-lg border border-amber-200/50">
              <Heart className="h-16 w-16 text-amber-500 fill-amber-500/20" />
            </div>
          </div>
          <motion.div
            className="absolute -inset-2 rounded-2xl bg-amber-200/20 blur-xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        </motion.div>

        <motion.h2
          className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Your Favourites Awaits
        </motion.h2>

        <motion.p
          className="text-amber-700/80 mb-8 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          You haven&apos;t saved any favourite dishes yet.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Link
            href="/customer/menu"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-200 group"
          >
            <span className="relative">
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                Browse Menu
              </span>
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl mx-auto px-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 h-full flex flex-col">
          <div className="relative h-48 w-full">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="p-4 flex-1 flex flex-col space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full ml-2" />
            </div>
            <div className="mt-auto space-y-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
