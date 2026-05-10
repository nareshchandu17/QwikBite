"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { User, Settings, LogOut, Moon, Sun, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface UserDropdownProps {
  user: {
    name: string;
    email: string;
  };
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getProfileLink = () => {
    if (pathname?.startsWith('/customer')) return '/customer/profile';
    if (pathname?.startsWith('/admin')) return '/admin/profile';
    return '/profile';
  };

  const getSettingsLink = () => {
    if (pathname?.startsWith('/customer')) return '/customer/settings';
    if (pathname?.startsWith('/admin')) return '/admin/settings';
    return '/settings';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium hidden md:inline-block">{user.name}</span>
        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-amber-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-amber-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
          
          <Link 
            href={getProfileLink()} 
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4 mr-3 text-amber-600" />
            View Profile
          </Link>
          
          <Link 
            href={getSettingsLink()} 
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4 mr-3 text-amber-600" />
            Settings
          </Link>
          
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center">
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 mr-3 text-amber-600" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-3 text-amber-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </div>
          </button>
          
          <div className="border-t border-amber-100 dark:border-gray-700 mt-1 pt-1">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}