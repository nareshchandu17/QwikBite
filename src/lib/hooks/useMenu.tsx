import { useState, useEffect } from 'react';

export function useMenu(page = 1, limit = 50) {
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/menu?page=${page}&limit=${limit}`, { cache: 'no-store', credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        setItems(data?.data || []);
      })
      .catch(() => setItems([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [page, limit]);

  return { items, loading };
}
