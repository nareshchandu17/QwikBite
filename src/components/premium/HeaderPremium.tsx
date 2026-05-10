'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';

interface HeaderPremiumProps {
  query: string;
  onQuery: (query: string) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  sort: string;
  setSort: (sort: string) => void;
}

export default function HeaderPremium({
  query,
  onQuery,
  categories,
  selectedCategory,
  onSelectCategory,
  sort,
  setSort
}: HeaderPremiumProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-2xl mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Premium Experience</h2>
          </div>
          <p className="text-amber-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Exclusive items and priority service for premium members
          </p>
        </div>

        <div className="space-y-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search menu..."
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-amber-50 bg-opacity-10 text-white placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          />
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-amber-50 bg-opacity-10 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
            
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-amber-50 bg-opacity-10 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              <option value="popular">Sort by: Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}