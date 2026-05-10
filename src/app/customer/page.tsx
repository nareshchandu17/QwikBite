'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
// Import all the components you mentioned
import TiffinsCarousel from '@/components/TiffinsCarousel';
import LunchSpecialsCarousel from '@/components/LunchSpecialsCarousel';
import CampusFavoritesCarousel from '@/components/CampusFavoritesCarousel';
import ShareWithFriends from '@/components/ShareWithFriends';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import HowItWorksPremium from '@/components/HowItWorksPremium';
import { MenuItem } from '@/data/menu';
import { CampusFavoriteItem } from '@/data/campusFavorites';
import { Utensils, Clock, Star, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import TimeSlotModal from '@/components/TimeSlotModal';

// Dynamically import components that might have SSR issues
const ConditionalFAQAndFooter = dynamic(
  () => import('@/components/ConditionalFAQAndFooter'),
  { ssr: false }
);

export default function CustomerHomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [campusFavorites, setCampusFavorites] = useState<CampusFavoriteItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | CampusFavoriteItem | null>(null);

  useEffect(() => {
    setMounted(true);

    // Role-based redirection if user is not a customer
    if (!loading && isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'canteen_staff') {
        console.log('[CustomerPage] User is not a customer, redirecting to admin dashboard');
        router.replace('/admin/dashboard');
      }
    }

    // Only redirect if we're sure the user is not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    // Import menu data
    import('@/data/menu').then((module) => {
      setMenuItems(module.menuItems);
    });

    import('@/data/campusFavorites').then((module) => {
      setCampusFavorites(module.default);
    });
  }, []);

  const handleBuyNow = useCallback((item: MenuItem | CampusFavoriteItem) => {
    // Open time slot modal directly
    setSelectedItem(item);
    setIsTimeSlotModalOpen(true);
  }, []);


  if (!isAuthenticated && !loading) {
    return null; // Let AuthRedirector handle the redirect
  }


  // Filter menu items by category
  const tiffinsItems = menuItems.filter(item => item.category === 'Tiffins' && item.available);
  const lunchSpecialsItems = menuItems.filter(item =>
    (item.category === 'Curries' || item.category === 'Fast Food') && item.available
  );
  const campusFavoritesItems = campusFavorites;

  return (
    <div className="min-h-screen bg-white">
      {/* Time Slot Modal */}
      <TimeSlotModal
        isOpen={isTimeSlotModalOpen}
        onClose={() => setIsTimeSlotModalOpen(false)}
        item={selectedItem}
      />
      {/* Hero Section */}
      <section className="relative w-full h-screen">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/herosection.jpg"
            alt="Delicious food selection"
            fill
            className="object-cover brightness-100"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/5"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            {loading ? (
              <div className="h-8 w-48 bg-white/20 rounded-full animate-pulse mx-auto mb-4 backdrop-blur-md border border-white/30" />
            ) : user?.name && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-md border border-white/30 shadow-sm mb-4">
                👋 Welcome back, <span className="font-semibold">{user.name}!</span>
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 drop-shadow-lg">
                Skip the Queue,
              </span>{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 drop-shadow-lg">
                Save Your Time
              </span>
            </h1>

            <p className="text-lg sm:text-xl mb-10 text-white max-w-2xl mx-auto leading-relaxed font-medium">
              Your favorite canteen dishes—just a few taps away. Order now and collect without the wait.
            </p>

            <div className="flex justify-center">
              <Link
                href="/customer/menu"
                className="relative group bg-gradient-to-r from-amber-500 to-orange-600 text-white 
                font-semibold py-2 px-6 rounded-full inline-flex items-center gap-1
                whitespace-nowrap w-auto transition-all duration-300 hover:scale-105 
                hover:shadow-lg hover:shadow-amber-500/30"
              >
                <span className="relative z-10 flex items-center gap-1">
                  Order Now
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>

                <span className="absolute inset-0 rounded-full bg-gradient-to-r 
                from-amber-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksPremium />

      {/* Tiffins Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Fresh Tiffin&apos;s Today</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start your day right with our delicious and healthy tiffin options
            </p>
          </div>

          <div className="px-4">
            <TiffinsCarousel items={tiffinsItems} onBuyNow={handleBuyNow} />
          </div>
        </div>
      </section>

      {/* Lunch Specials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Lunch Specials</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Delicious curries and fast food options for your perfect lunch
            </p>
          </div>

          <div className="px-4">
            <LunchSpecialsCarousel items={lunchSpecialsItems} onBuyNow={handleBuyNow} />
          </div>
        </div>
      </section>

      {/* Campus Favorites Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Campus Favorites</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Most Loved Dishes by Students</p>
          </div>

          <div className="px-4">
            <CampusFavoritesCarousel items={campusFavoritesItems} onBuyNow={handleBuyNow} />
          </div>
        </div>
      </section>

      {/* Share with Friends Section */}
      <ShareWithFriends />

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <FAQ />
      </section>

      {/* Footer */}
      <section className="bg-amber-50">
        <div className="container mx-auto px-4">
          <Footer />
        </div>
      </section>
    </div>
  );
}