'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, StarIcon, CalendarIcon, TagIcon } from 'lucide-react';

interface FeedbackFiltersProps {
  onCategoryChange: (category: string) => void;
  onRatingChange: (rating: number | null) => void;
  onDateRangeChange: (range: string) => void;
  onCustomDateRangeChange?: (startDate: string, endDate: string) => void;
}

const FeedbackFilters: React.FC<FeedbackFiltersProps> = ({
  onCategoryChange,
  onRatingChange,
  onDateRangeChange,
  onCustomDateRangeChange,
}) => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All Time');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const categories = ['Food', 'Service', 'Cleanliness', 'Other'];
  const ratings = [5, 4, 3, 2, 1];
  const dateRanges = ['Today', 'Last 7 Days', 'Last 30 Days', 'Custom Range'];

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCategoryOpen(false);
    onCategoryChange(category === 'All Categories' ? '' : category);
  };

  const handleRatingSelect = (rating: number | null) => {
    setSelectedRating(rating);
    setRatingOpen(false);
    onRatingChange(rating);
  };

  const handleDateRangeSelect = (range: string) => {
    setSelectedDateRange(range);
    setDateRangeOpen(false);
    
    if (range === 'Custom Range') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      onDateRangeChange(range);
    }
  };

  const handleCustomDateRangeApply = () => {
    if (customStartDate && customEndDate && onCustomDateRangeChange) {
      onCustomDateRangeChange(customStartDate, customEndDate);
      setSelectedDateRange(`Custom: ${customStartDate} to ${customEndDate}`);
      setShowCustomDatePicker(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Category Filter */}
        <div className="relative flex-1">
          <button
            onClick={() => setCategoryOpen(!categoryOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <TagIcon className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-700">{selectedCategory}</span>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-purple-600 transition-transform duration-200 ${
                categoryOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          {categoryOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => handleCategorySelect('All Categories')}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <span className="text-gray-700">All Categories</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-gray-700">{category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Star Rating Filter */}
        <div className="relative flex-1">
          <button
            onClick={() => setRatingOpen(!ratingOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg hover:from-yellow-100 hover:to-amber-100 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <StarIcon className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-gray-700">
                {selectedRating ? `${selectedRating} Stars` : 'All Ratings'}
              </span>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-yellow-600 transition-transform duration-200 ${
                ratingOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          {ratingOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => handleRatingSelect(null)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <span className="text-gray-700">All Ratings</span>
              </button>
              {ratings.map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingSelect(rating)}
                  className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {renderStars(rating)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="relative flex-1">
          <button
            onClick={() => setDateRangeOpen(!dateRangeOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">{selectedDateRange}</span>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${
                dateRangeOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          {dateRangeOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => handleDateRangeSelect('All Time')}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <span className="text-gray-700">All Time</span>
              </button>
              {dateRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => handleDateRangeSelect(range)}
                  className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-gray-700">{range}</span>
                </button>
              ))}
            </div>
          )}

          {/* Custom Date Range Picker */}
          {showCustomDatePicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowCustomDatePicker(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomDateRangeApply}
                    disabled={!customStartDate || !customEndDate}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selectedCategory !== 'All Categories' && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            <TagIcon className="w-4 h-4" />
            {selectedCategory}
            <button
              onClick={() => handleCategorySelect('All Categories')}
              className="ml-1 hover:text-purple-900"
            >
              ×
            </button>
          </div>
        )}
        {selectedRating && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <StarIcon className="w-4 h-4" />
            {selectedRating} Stars
            <button
              onClick={() => handleRatingSelect(null)}
              className="ml-1 hover:text-yellow-900"
            >
              ×
            </button>
          </div>
        )}
        {selectedDateRange !== 'All Time' && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <CalendarIcon className="w-4 h-4" />
            {selectedDateRange}
            <button
              onClick={() => handleDateRangeSelect('All Time')}
              className="ml-1 hover:text-blue-900"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackFilters;
