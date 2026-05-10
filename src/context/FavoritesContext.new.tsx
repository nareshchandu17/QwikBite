'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Type for a favorite item
type FavoriteItem = string;

// Type for the context value
interface FavoritesContextType {
  favorites: FavoriteItem[];
  toggleFavorite: (id: string, itemType?: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  fetchFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Fetch favorites from the API
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/favorites', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch favorites');
      }

      const data = await response.json();
      const favoritesList = Array.isArray(data) 
        ? data.map((fav: unknown) => fav.itemId).filter(Boolean)
        : [];
      
      setFavorites(favoritesList);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (itemId: string, itemType: string = 'menu') => {
    try {
      const isCurrentlyFavorite = favorites.includes(itemId);
      
      console.log('[FavoritesContext] Toggling favorite:', { itemId, isCurrentlyFavorite, itemType });
      
      // Optimistically update the UI
      setFavorites(prev => isCurrentlyFavorite 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
      );
      
      const url = '/api/favorites' + (isCurrentlyFavorite ? `?itemId=${encodeURIComponent(itemId)}&itemType=${encodeURIComponent(itemType)}` : '');
      const options: RequestInit = {
        method: isCurrentlyFavorite ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: isCurrentlyFavorite ? undefined : JSON.stringify({ 
          itemId,
          itemType
        })
      };

      console.log('[FavoritesContext] Making request to:', { url, method: options.method });
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[FavoritesContext] API error:', errorData);
        throw new Error(errorData.error || `Failed to ${isCurrentlyFavorite ? 'remove from' : 'add to'} favorites`);
      }
      
      const responseData = await response.json();
      console.log('[FavoritesContext] ✅ Success:', responseData);
      
      // Refresh from server to ensure consistency
      await fetchFavorites();
    } catch (err) {
      console.error('[FavoritesContext] Error toggling favorite:', err);
      // Re-fetch to ensure sync with server
      await fetchFavorites();
      throw err; // Re-throw to allow error handling in components
    }
  }, [favorites, fetchFavorites]);
  
  // Check if an item is favorited
  const isFavorite = useCallback((id: string) => {
    return favorites.includes(id);
  }, [favorites]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const contextValue: FavoritesContextType = {
    favorites,
    toggleFavorite,
    isFavorite,
    loading,
    error,
    isAuthenticated,
    fetchFavorites,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
