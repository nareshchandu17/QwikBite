import { useState, useEffect } from 'react';

export function useOrders(userId: string | null, page = 1, limit = 20) {
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    fetch(`/api/orders?userId=${userId}&page=${page}&limit=${limit}`, { cache: 'no-store', credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (!mounted) return; setOrders(data?.data?.orders || (Array.isArray(data?.data) ? data.data : [])); })
      .catch(() => setOrders([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [userId, page, limit]);

  return { orders, loading };
}
