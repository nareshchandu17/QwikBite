'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { usePusher } from '@/context/PusherContext';
import { toast } from 'sonner';
import { MenuItem } from '@/data/menu';

interface FoodMenuProps {
  categories?: string[];
}

const FoodMenu = ({ categories: categoryList = ['All', 'Tiffins', 'Fast Food', 'Curries', 'Drinks', 'Juices', 'Mocktails', 'Hot N Crunch', 'Snacks', 'Tea Corner'] }: FoodMenuProps) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { pusherClient } = usePusher();

  // Fetch menu items from API
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menu', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch menu items');
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Load items on component mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Listen for real-time menu updates
  useEffect(() => {
    if (!pusherClient) return;

    const handleMenuUpdate = (event: string, data: MenuItem) => {
      console.log(`Customer received menu ${event} event:`, data);

      switch (event) {
        case 'created':
          setMenuItems(prev => [...prev, data]);
          toast.success(`New item "${data.name}" added to your menu!`);
          break;
        case 'updated':
          setMenuItems(prev => prev.map(item => item.id === data.id ? data : item));
          break;
        case 'deleted':
          setMenuItems(prev => prev.filter(item => item.id !== data.id));
          toast.info(`"${data.name}" has been removed from the menu.`);
          break;
      }
    };

    // Set up event listeners
    const channel = pusherClient.subscribe('broadcast');
    channel.bind('menu:created', (data: MenuItem) => handleMenuUpdate('created', data));
    channel.bind('menu:updated', (data: MenuItem) => handleMenuUpdate('updated', data));
    channel.bind('menu:deleted', (data: MenuItem) => handleMenuUpdate('deleted', data));

    // Clean up
    return () => {
      channel.unbind('menu:created');
      channel.unbind('menu:updated');
      channel.unbind('menu:deleted');
      pusherClient.unsubscribe('broadcast');
    };
  }, [pusherClient]);

  // Filter items by category
  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const categories = categoryList.map(cat => ({
    id: cat,
    name: cat,
    menuItems: cat === 'All' ? menuItems : menuItems.filter(item => item.category === cat)
  }));

  const updateQuantity = (itemId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Category Navigation */}
      {!loading && (
        <div className="flex overflow-x-auto pb-4 mb-8 hide-scrollbar">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap mr-4 ${activeCategory === category.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {category.name}
              {category.menuItems.length > 0 && (
                <span className="ml-2 text-sm opacity-75">
                  ({category.menuItems.length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Menu Items */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${!item.available ? 'opacity-70' : ''
                }`}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                {/* Availability Indicator */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold z-10 ${item.available
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                  }`}>
                  {item.available ? 'Available' : 'Sold Out'}
                </div>
                {item.isPopular && (
                  <div className="absolute top-10 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Popular
                  </div>
                )}
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!item.available) return;

                    try {
                      await toggleFavorite(item.id);

                      // Show success feedback
                      if (typeof window !== 'undefined' && 'toast' in window) {
                        (window as any).toast.success(
                          isFavorite(item.id)
                            ? 'Added to favorites!'
                            : 'Removed from favorites!'
                        );
                      }
                    } catch (err) {
                      const error = err as Error;
                      console.error('Error toggling favorite:', error);

                      // Show error feedback
                      if (typeof window !== 'undefined' && 'toast' in window) {
                        (window as any).toast.error(
                          error.message || 'Failed to update favorites'
                        );
                      }
                    }
                  }}
                  className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 ${isFavorite(item.id)
                      ? 'text-red-500 bg-white/90 hover:bg-red-100 scale-110'
                      : 'text-gray-700 bg-white/80 hover:bg-white hover:text-red-500'
                    } ${!item.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={!item.available
                    ? 'This item is not available'
                    : isFavorite(item.id)
                      ? 'Remove from favorites'
                      : 'Add to favorites'}
                  disabled={!item.available}
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${isFavorite(item.id) ? 'fill-current' : ''}`}
                  />
                  {isFavorite(item.id) && (
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
                  )}
                </button>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                  <span className="text-lg font-bold text-amber-600">
                    ₹{item.price}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4">{item.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {item.calories} cal
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {quantities[item.id] > 0 ? (
                      <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-gray-600 hover:text-amber-600"
                          disabled={!item.available}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-6 text-center font-medium">
                          {quantities[item.id]}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-gray-600 hover:text-amber-600"
                          disabled={!item.available}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className={`flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${item.available
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        disabled={!item.available}
                      >
                        <ShoppingCart size={16} />
                        <span>{item.available ? 'Add to Cart' : 'Sold Out'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodMenu;                        