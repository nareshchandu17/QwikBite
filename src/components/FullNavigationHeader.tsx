'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Utensils as MenuIcon,
  Heart,
  ListOrdered,
  MessageCircle,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  X,
  Menu as MenuIconMobile,
  Search,
  Bell,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { isCustomer, isAdmin } from '@/lib/auth/roleGuard';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import UserDropdown from '@/components/UserDropdown';

type IconComponent = React.ComponentType<{ className?: string }>; 

type NavLink = {
  name: string;
  href: string;
  Icon: IconComponent;
};

const NAV_LINKS: NavLink[] = [
  { name: 'Menu', href: '/customer/menu', Icon: MenuIcon },
  { name: 'Orders', href: '/customer/orders', Icon: ListOrdered },
  { name: 'Favorites', href: '/customer/favorites', Icon: Heart },
  { name: 'Feedback', href: '/customer/feedback', Icon: MessageCircle },
];

const FullNavigationHeader: React.FC = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openModal: openAuthModal } = useAuthModal();

  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleOpenAuthModal = (mode: 'signin' | 'signup') => {
    openAuthModal(mode);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  if (!hasMounted) {
    return <div className="fixed w-full h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/30 dark:border-gray-700/30 z-50" />;
  }

  const renderDesktopLinks = () => (
    <div className="hidden md:flex items-center justify-center flex-1 mx-4 lg:mx-8">
      <div className="flex items-center space-x-1 lg:space-x-2">
        {NAV_LINKS.map(({ name, href, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname && pathname.startsWith(href));
          const linkClasses = cn(
            'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
            active
              ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
              : 'text-gray-700 hover:text-amber-600 dark:text-gray-300 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
            'flex items-center gap-2'
          );

          return (
            <Link
              key={href}
              href={href}
              className={linkClasses}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const renderRightSideButtons = () => (
    <div className="flex items-center space-x-4 lg:space-x-5 flex-shrink-0">
      {/* Notifications */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={(pathname && pathname.startsWith('/customer')) ? '/customer/notifications' : '/notifications'}
              className={`relative flex items-center rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors ${
                isScrolled 
                  ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800' 
                  : 'text-gray-700 hover:bg-white/20 dark:text-white dark:hover:bg-white/10'
              }`}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                3
              </span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      

      {loading ? (
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      ) : isAuthenticated && user ? (
        <UserDropdown user={user} />
      ) : (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleOpenAuthModal('signin')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-amber-600 dark:text-gray-200 dark:hover:text-amber-400' 
                      : 'text-gray-700 hover:text-amber-600 dark:text-white dark:hover:text-amber-400'
                  }`}
                >
                  Sign in
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                <p>Sign in to your account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleOpenAuthModal('signup')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isScrolled 
                      ? 'bg-amber-600 text-white hover:bg-amber-700' 
                      : 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600'
                  }`}
                >
                  Sign up
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                <p>Create a new account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );

  const renderMobileLinks = () => (
    <div className="space-y-2 px-4 pb-4 pt-2 sm:px-6">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}      
          className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-base font-medium transition-colors ${
            pathname === link.href
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'text-gray-700 hover:bg-amber-50 dark:text-gray-300 dark:hover:bg-amber-900/20'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <link.Icon
            className={`h-5 w-5 ${
              pathname === link.href
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-amber-600/80 dark:text-amber-400/80'
            }`}
          />
          <span>{link.name}</span>
        </Link>
      ))}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="relative px-3">
          <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search menu items..."
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Link
          href="/customer/order-status"
          className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-amber-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-amber-400"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <ListOrdered className="mr-2 h-5 w-5" />
          Live Queue
        </Link>
        {user && (
          <Link
            href={(pathname && pathname.startsWith('/customer')) ? '/customer/notifications' : '/notifications'}
            className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-amber-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-amber-400"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Bell className="mr-2 h-5 w-5" />
            Notifications
          </Link>
        )}
        {loading ? (
          <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        ) : isAuthenticated && user ? (
          <div className="mt-2 border-t border-gray-800 pt-2">
            <div className="border-b border-gray-200 dark:border-gray-700 px-3 py-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Role: {user.role}</p>
            </div>

            {isCustomer(user) && (
              <>
                <Link
                  href={pathname?.startsWith('/customer') ? '/customer/profile' : '/profile'}
                  className="block w-full px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="mr-2 h-5 w-5 inline" />
                  View Profile
                </Link>
                <Link
                  href={pathname?.startsWith('/customer') ? '/customer/settings' : '/settings'}
                  className="block w-full px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="mr-2 h-5 w-5 inline" />
                  Settings
                </Link>
                <Link
                  href="/help"
                  className="block w-full px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MessageCircle className="mr-2 h-5 w-5 inline" />
                  Help & Support
                </Link>
              </>
            )}

            {isAdmin(user) && (
              <div>
                <Link
                  href="/admincanteen/settings"
                  className="block w-full px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="mr-2 h-5 w-5 inline" />
                  Admin Settings
                </Link>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="flex w-full items-center space-x-2 rounded px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="mt-2 space-y-2 border-t border-gray-800 pt-2">
            <button
              onClick={() => handleOpenAuthModal('signin')}
              className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => handleOpenAuthModal('signup')}
              className="w-full rounded-md border border-amber-600 bg-transparent px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-900/30 transition-colors"
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/30 dark:border-gray-700/30' 
          : 'bg-transparent dark:bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left side */}
          <div className="flex-shrink-0">
            <Link 
              href={pathname?.startsWith('/customer') ? '/customer' : '/'} 
              className="flex items-center"
            >
              <span className="text-2xl font-extrabold">
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  Canteen
                </span>
                <span className="text-gray-900 dark:text-white">Buddy</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <nav className="flex items-center space-x-1 lg:space-x-20 px-4 py-1">
              {NAV_LINKS.map(({ name, href, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                    pathname === href || (href !== '/' && pathname?.startsWith(href))
                      ? 'text-amber-600 dark:text-amber-400 font-medium'
                      : 'text-gray-800 hover:text-amber-600 dark:text-gray-200 dark:hover:text-amber-400'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop buttons */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              {renderRightSideButtons()}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <MenuIconMobile className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 w-full origin-top-right rounded-b-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10 md:hidden">
          {renderMobileLinks()}
        </div>
      )}
    </header>
  );
};

export default FullNavigationHeader;