import React, { useState } from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types/menu';
import { VegIcon, NonVegIcon, SpicyIcon } from '../icons';

interface CategoryIconProps {
  tags: string[];
  category: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ tags, category }) => {
  const isVeg = tags.includes('Vegetarian') || tags.includes('Veg') || category === 'Juices' || category === 'Drinks';
  const isNonVeg = tags.includes('Non-Veg') || tags.includes('Egg');
  const isSpicy = tags.includes('Spicy');

  return (
    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
      {isVeg && <VegIcon title="Veg" className="w-3 h-3" />}
      {isNonVeg && <NonVegIcon title="Non-Veg" className="w-3 h-3" />}
      {isSpicy && <SpicyIcon title="Spicy" className="w-3 h-3" />}
      <span className="text-[10px] font-bold text-white/90 tracking-wide uppercase">
        {isVeg ? 'Veg' : isNonVeg ? 'Non-Veg' : 'Other'}
      </span>
    </div>
  );
};

interface DishCardProps {
  dish: MenuItem;
  index: number;
  onEdit: (dish: MenuItem) => void;
}

const DishCard: React.FC<DishCardProps> = ({ dish, index, onEdit }) => {
  const isOutOfStock = !dish.available;
  
  return (
    <div 
      className="group relative h-[320px] rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-glow-primary/50 hover:-translate-y-2"
      style={{ 
        opacity: 0, 
        animation: `fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.05}s` 
      }}
    >
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="relative w-full h-full">
          <Image
            src={dish.image || '/images/placeholder-food.jpg'}
            alt={dish.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-transform duration-700 ease-custom-ease group-hover:scale-110 ${
              isOutOfStock ? 'grayscale opacity-60' : ''
            }`}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = '/images/placeholder-food.jpg';
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500"></div>
      </div>

      {/* Floating Price Tag */}
      <div className="absolute top-4 right-4 z-10">
        <div className="glass-surface px-3 py-1.5 rounded-xl flex flex-col items-center border border-white/10 shadow-lg group-hover:bg-primary/20 transition-colors duration-300">
          <span className="text-sm font-bold text-white">₹{dish.price}</span>
        </div>
      </div>

      {/* Top Left Dietary Badges */}
      <div className="absolute top-4 left-4 z-10 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out delay-100">
        <CategoryIcon tags={dish.tags} category={dish.category} />
      </div>
      
      {/* Status Indicator (Always Visible if Out of Stock) */}
      {isOutOfStock && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-full font-bold text-xs tracking-widest uppercase border border-red-400 shadow-xl backdrop-blur-sm transform -rotate-12">
            Out of Stock
          </div>
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <div className="mb-1">
          <div className="flex gap-2 flex-wrap mb-2">
            {dish.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-xl font-bold text-white leading-tight mb-1 drop-shadow-md group-hover:text-amber-300 transition-colors duration-300">
            {dish.name}
          </h3>
          <p className="text-xs text-neutral-300/80 line-clamp-2 group-hover:text-white/90 transition-colors duration-300">
            {dish.description}
          </p>
        </div>

        {/* Hover Actions Slide Up */}
        <div className="h-0 group-hover:h-12 overflow-hidden transition-all duration-500 ease-custom-ease opacity-0 group-hover:opacity-100 mt-0 group-hover:mt-3">
          <div className="flex gap-2 pt-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(dish); }}
              className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg shadow-amber-500/30 hover:bg-amber-500 transition-all duration-300"
            >
              Edit Dish
            </button>
            <button className="bg-white/10 text-white p-2 rounded-lg hover:bg-white/20 transition-all duration-300">
              <span className="w-4 h-4">⋮</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishCard;
