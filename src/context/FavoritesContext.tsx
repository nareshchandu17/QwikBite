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

  // Fetch favorites from the API - optimized for performance
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch favorites');
      }

      const { data } = await response.json();
      console.log('[FavoritesContext] Fetched favorites from DB:', data);
      setFavorites(Array.isArray(data) ? data.map((fav: any) => fav.itemId.toString()) : []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (itemId: string, itemType: string = 'menu') => {
    const previousFavorites = [...favorites];
    const isCurrentlyFavorite = favorites.includes(itemId);

    // Optimistic update
    setFavorites(prev =>
      isCurrentlyFavorite
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );

    try {
      const url = '/api/favorites' + (isCurrentlyFavorite ? `?itemId=${itemId}` : '');
      const options: RequestInit = {
        method: isCurrentlyFavorite ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      };

      if (!isCurrentlyFavorite) {
        options.body = JSON.stringify({ itemId, itemType });
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update favorite');
      }

    } catch (err: any) {
      console.error('Favorite Toggle Failed:', err);
      setFavorites(previousFavorites);
      setError(err.message || "Failed to update favorites");
    }
  }, [favorites]);

  // Check if an item is favorited
  const isFavorite = useCallback((id: string) => {
    return favorites.includes(id);
  }, [favorites]);

  // Initial data fetch
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const contextValue: FavoritesContextType = {
    favorites,
    toggleFavorite,
    isFavorite,
    loading,
    error,
    isAuthenticated: true, // We'll let the API handle authentication
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
