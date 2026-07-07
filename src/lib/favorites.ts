export function normalizeFavoriteItemId(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  if (!normalized) return null;

  return normalized;
}

export function shouldTreatFavoriteResponseAsSuccess(
  status: number,
  body?: { error?: string; message?: string } | null,
  isCurrentlyFavorite = false
) {
  if (status >= 200 && status < 300) {
    return true;
  }

  if (status === 409) {
    const errorMessage = (body?.error || body?.message || '').toLowerCase();
    return (
      isCurrentlyFavorite === false &&
      (errorMessage.includes('already') || errorMessage.includes('duplicate'))
    );
  }

  return false;
}
