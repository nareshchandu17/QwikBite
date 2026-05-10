'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { menuItems, categories } from '@/data/menu';
import PremiumHeader from '@/components/premium/HeaderPremium';
import CarouselRow from '@/components/premium/CarouselRow';
import PremiumCard from '@/components/premium/PremiumCard';
import FloatingCart from '@/components/premium/FloatingCart';
import BackToTop from '@/components/premium/BackToTop';

export default function PremiumMenuPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sort, setSort] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = [...menuItems];
    
    if (selectedCategory !== 'all') {
      items = items.filter(i => i.category.toLowerCase() === selectedCategory);
    }
    if (q) {
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.description.toLowerCase().includes(q)
      );
    }

    if (sort === 'price-asc') items.sort((a,b) => a.price - b.price);
    else if (sort === 'price-desc') items.sort((a,b) => b.price - a.price);
    else items.sort((a,b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));

    return items;
  }, [query, selectedCategory, sort]);

  // Calculate total pages
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  // Get current items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategory, sort]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100">
      <PremiumHeader
        query={query}
        onQuery={setQuery}
        categories={categories}
        selectedCategory={selectedCategory}
  onSelectCategory={(c: string) => setSelectedCategory(c.toLowerCase())}
        sort={sort}
        setSort={setSort}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Top Picks carousel from All */}
        <section className="mb-12">
          <h2 className="text-3xl font-extrabold mb-4">Top Picks</h2>
          <CarouselRow items={menuItems.slice(0, 10)} />
        </section>

        {/* Category carousels */}
        <section className="space-y-10">
          {categories.filter(c => c !== 'All').map(cat => (
            <div key={cat}>
              <h3 className="text-2xl font-bold mb-4">{cat}</h3>
              <CarouselRow items={menuItems.filter(i => i.category === cat).slice(0, 8)} />
            </div>
          ))}
        </section>

        {/* Grid view with pagination */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">All Items</h3>
            <div className="text-gray-400">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}-
              {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} items
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {currentItems.map(item => (
              <PremiumCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-md bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    currentPage === page 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-md bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </main>

      <FloatingCart />
      <BackToTop />
    </div>
  );
}
