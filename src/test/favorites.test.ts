import { describe, expect, it } from 'vitest';
import { normalizeFavoriteItemId, shouldTreatFavoriteResponseAsSuccess } from '@/lib/favorites';
import { Favorite } from '@/models/favorite.model';

describe('normalizeFavoriteItemId', () => {
  it('accepts common string IDs used by menu items', () => {
    expect(normalizeFavoriteItemId('1')).toBe('1');
    expect(normalizeFavoriteItemId('abc123')).toBe('abc123');
  });

  it('trims whitespace and rejects empty values', () => {
    expect(normalizeFavoriteItemId(' 42 ')).toBe('42');
    expect(normalizeFavoriteItemId('   ')).toBeNull();
    expect(normalizeFavoriteItemId(undefined)).toBeNull();
  });

  it('uses a mixed schema for menuItem so string IDs are accepted', () => {
    expect(Favorite.schema.path('menuItem').instance).toBe('Mixed');
  });

  it('treats duplicate-favorite conflicts as a successful no-op', () => {
    expect(shouldTreatFavoriteResponseAsSuccess(409, { error: 'This item is already in your favorites' })).toBe(true);
    expect(shouldTreatFavoriteResponseAsSuccess(409, { error: 'Failed to update favorite' })).toBe(false);
  });
});
