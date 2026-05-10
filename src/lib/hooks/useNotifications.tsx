import { useState, useEffect } from 'react';

export function useNotifications(userId: string | null, page = 1, limit = 20) {
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setNotifications([]); setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    fetch(`/api/notifications?userId=${userId}&page=${page}&limit=${limit}`, { cache: 'no-store', credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (!mounted) return; setNotifications(data?.data || []); })
      .catch(() => setNotifications([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [userId, page, limit]);

  return { notifications, loading };
}
