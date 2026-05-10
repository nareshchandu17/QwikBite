export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories?: number;
  image: string;
  category: string;
  tags: string[];
  available: boolean;
  prep_time: number;
}

export const categories = [
  'All',
  'Tiffins',
  'Fast Food',
  'Curries',
  'Drinks',
  'Juices',
  'Mocktails',
  'Hot N Crunch',
  'Snacks',
  'Tea Corner'
] as const;

export type Category = typeof categories[number];
