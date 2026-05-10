import { useState, useEffect } from 'react';

export function useFeedback(userId: string | null, page = 1, limit = 50) {
  const [feedbacks, setFeedbacks] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setFeedbacks([]); setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    fetch(`/api/feedback?userId=${userId}&page=${page}&limit=${limit}`, { cache: 'no-store', credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (!mounted) return; setFeedbacks(data?.data || []); })
      .catch(() => setFeedbacks([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [userId, page, limit]);

  return { feedbacks, loading };
}
