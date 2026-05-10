import { useState, useEffect } from 'react';

export function useFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setFavorites([]); setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    fetch(`/api/favorites?userId=${userId}`, { cache: 'no-store', credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (!mounted) return; setFavorites((data || []).map((f: unknown) => f.itemId)); })
      .catch(() => setFavorites([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [userId]);

  return { favorites, loading };
}
