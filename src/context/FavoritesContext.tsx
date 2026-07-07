'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { toast } from 'sonner';
import { shouldTreatFavoriteResponseAsSuccess } from '@/lib/favorites';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FavoriteItem = string;

interface FavoritesContextType {
  favorites: FavoriteItem[];
  toggleFavorite: (id: string, itemType?: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  fetchFavorites: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Guard against React Strict Mode double-invocation and rapid repeated clicks.
   * Tracks which itemIds are currently mid-flight.
   */
  const inFlightRef = useRef<Set<string>>(new Set());

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch favorites');
      }

      const { data } = await response.json();
      setFavorites(
        Array.isArray(data)
          ? data
              .map((fav: any) => String(fav?.itemId ?? '').trim())
              .filter(Boolean)
          : []
      );
      setError(null);
    } catch (err: any) {
      console.error('[FavoritesContext] Error fetching favorites:', err);
      setError(err.message || 'Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Toggle ──────────────────────────────────────────────────────────────
  /**
   * SINGLE SOURCE OF TRUTH for favorite toasts.
   *
   * Rules:
   *  • One click  → one API request  → one toast
   *  • Optimistic update fires instantly (<100ms perceived latency)
   *  • If API fails → rollback state + show exactly one error toast
   *  • Uses stable toast ID per item so sonner deduplicates if called twice
   *  • inFlightRef prevents duplicate requests from Strict Mode or rapid clicks
   */
  const toggleFavorite = useCallback(
    async (itemId: string, itemType: string = 'menu') => {
      // ── Duplicate-request guard ───────────────────────────────────────────
      if (inFlightRef.current.has(itemId)) {
        return; // already processing this item — swallow silently
      }
      inFlightRef.current.add(itemId);

      setError(null);

      // ── Read current state synchronously before any async work ───────────
      const isCurrentlyFavorite = favorites.includes(itemId);
      const previousFavorites = [...favorites];

      // ── 1. Optimistic UI update (instant) ────────────────────────────────
      setFavorites((prev) =>
        isCurrentlyFavorite
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId]
      );

      // ── 2. Show exactly ONE toast (stable ID deduplicates in sonner) ─────
      const toastId = `fav-${itemId}`;
      if (isCurrentlyFavorite) {
        toast('💔 Removed from Favorites', {
          id: toastId,
          duration: 2500,
          style: {
            background: '#fff',
            color: '#111',
            border: '1px solid #fee2e2',
            fontWeight: 500,
          },
        });
      } else {
        toast('❤️ Added to Favorites', {
          id: toastId,
          duration: 2500,
          style: {
            background: '#fff',
            color: '#111',
            border: '1px solid #fef3c7',
            fontWeight: 500,
          },
        });
      }

      // ── 3. Background API sync ────────────────────────────────────────────
      try {
        const url =
          '/api/favorites' + (isCurrentlyFavorite ? `?itemId=${itemId}` : '');
        const options: RequestInit = {
          method: isCurrentlyFavorite ? 'DELETE' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        };

        if (!isCurrentlyFavorite) {
          options.body = JSON.stringify({ itemId, itemType });
        }

        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));

        if (!response.ok && !shouldTreatFavoriteResponseAsSuccess(response.status, data, isCurrentlyFavorite)) {
          throw new Error(data.error || 'Failed to update favorite');
        }
        // ✅ Success — optimistic state is already correct, no refetch needed
      } catch (err: any) {
        console.error('[FavoritesContext] Favorite toggle failed:', err);

        // ── 4. Rollback optimistic update ─────────────────────────────────
        setFavorites(previousFavorites);
        setError(err.message || 'Failed to update favorites');

        // ── 5. Replace the success toast with an error toast (same ID) ────
        toast.error('Failed to update favorites. Please try again.', {
          id: toastId,
          duration: 3500,
        });
      } finally {
        // ── Always release the guard ──────────────────────────────────────
        inFlightRef.current.delete(itemId);
      }
    },
    [favorites]
  );

  // ─── Derived ─────────────────────────────────────────────────────────────
  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  // ─── Initial fetch (runs once on mount) ──────────────────────────────────
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const contextValue: FavoritesContextType = {
    favorites,
    toggleFavorite,
    isFavorite,
    loading,
    error,
    isAuthenticated: true, // authentication is enforced at the API layer
    fetchFavorites,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
