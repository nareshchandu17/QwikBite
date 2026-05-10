'use client';

import React from 'react';
import Image from 'next/image';
import { Star, Heart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useFavorites } from '@/context/FavoritesContext';

export default function PremiumCard({ item, compact }: { item: unknown; compact?: boolean }) {
  const { items, addItem, removeItem } = useCartStore();
  const isInCart = items.some((cartItem) => cartItem.id === item.id);
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleAddToCart = () => {
    addItem(item);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden ${compact ? '' : 'shadow-lg hover:shadow-xl transition-shadow'} ${!item.available ? 'opacity-70' : ''}`}>
      <div className="relative h-44">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
        {/* Availability Indicator */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold z-10 ${
          item.available 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {item.available ? 'Available' : 'Sold Out'}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 ${
            isFavorite(item.id) 
              ? 'text-red-500 bg-white/90 hover:bg-white scale-110' 
              : 'text-gray-700 dark:text-gray-300 bg-white/80 hover:bg-white hover:text-red-500'
          }`}
          title="Add to favourites"
        >
          <Heart 
            className={`h-5 w-5 transition-colors ${isFavorite(item.id) ? 'fill-current' : ''}`} 
          />
          {isFavorite(item.id) && (
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
          )}
        </button>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h4>
          <span className="text-amber-500 font-bold">${item.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{item.description}</p>
        <div className="flex items-center gap-2 mt-3">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-gray-500">4.8</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {item.isPopular && <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Bestseller</span>}
            {item.tags?.includes('Vegetarian') && <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Veg</span>}
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={!item.available}
            className={`px-3 py-2 rounded-full font-semibold transition-colors ${
              item.available
                ? isInCart 
                  ? 'bg-green-500 text-white' 
                  : 'bg-amber-500 text-black hover:bg-amber-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isInCart ? 'Added' : item.available ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
