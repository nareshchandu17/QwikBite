import { describe, expect, it } from 'vitest';
import { getFavoriteButtonScale } from '@/lib/animations';

describe('getFavoriteButtonScale', () => {
  it('returns a slightly larger scale when the item is a favorite', () => {
    expect(getFavoriteButtonScale(true)).toBe(1.08);
  });

  it('returns the base scale when the item is not a favorite', () => {
    expect(getFavoriteButtonScale(false)).toBe(1);
  });
});
