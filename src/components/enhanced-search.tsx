'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EnhancedSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  dietaryOptions: { id: string; name: string }[];
  selectedDietary: string[];
  onDietaryChange: (diet: string) => void;
  onClearFilters: () => void;
}

export function EnhancedSearch({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  dietaryOptions,
  selectedDietary,
  onDietaryChange,
  onClearFilters,
}: EnhancedSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search Input Skeleton */}
        <div className="relative flex-grow">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 p-0.5 animate-gradient-xy">
            <div className="relative h-full w-full bg-white dark:bg-gray-800 rounded-[calc(0.5rem-1px)]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for items..."
                className="w-full h-full pl-10 pr-4 py-3 bg-transparent focus:outline-none"
                readOnly
              />
            </div>
          </div>
        </div>
        
        {/* Category Select Skeleton */}
        <div className="flex gap-2">
          <div className="h-11 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="w-[180px] h-11 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-grow group">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 p-0.5 animate-gradient-xy">
            <div className="relative h-full w-full bg-white dark:bg-gray-800 rounded-[calc(0.5rem-1px)]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-full pl-10 pr-4 py-3 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Filter and Category Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 group relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </span>
          </Button>
          
          <div className="relative group">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 p-0.5 animate-gradient-xy">
              <div className="relative h-full w-full bg-white dark:bg-gray-800 rounded-[calc(0.5rem-1px)]">
                <Select
                  value={selectedCategory}
                  onValueChange={onCategoryChange}
                >
                  <SelectTrigger className="w-[180px] border-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-sm"
                >
                  Clear all
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Dietary Preferences</h4>
                  <div className="space-y-2">
                    {dietaryOptions.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <Checkbox
                          id={`diet-${option.id}`}
                          checked={selectedDietary.includes(option.id)}
                          onCheckedChange={() => onDietaryChange(option.id)}
                          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor={`diet-${option.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {option.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
