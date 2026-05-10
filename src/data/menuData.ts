import { MenuItem } from './menu';

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe stuffed with spiced potato filling, served with sambar and chutney',
    price: 120,
    calories: 320,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format',
    category: 'Tiffins',
    tags: ['Vegetarian', 'South Indian', 'Popular'],
    available: true,
    prep_time: 15
  },
  {
    id: '2',
    name: 'Butter Chicken',
    description: 'Tender chicken pieces in a rich buttery tomato gravy',
    price: 280,
    calories: 580,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format',
    category: 'Meals',
    tags: ['Non-Veg', 'North Indian', 'Popular'],
    available: true,
    prep_time: 25
  },
  {
    id: '3',
    name: 'Paneer Tikka',
    description: 'Cottage cheese cubes marinated in spices and grilled to perfection',
    price: 220,
    calories: 320,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format',
    category: 'Snacks',
    tags: ['Vegetarian', 'Appetizer', 'Popular'],
    available: true,
    prep_time: 20
  },
  {
    id: '4',
    name: 'Mojito',
    description: 'Refreshing mint and lime mocktail',
    price: 120,
    calories: 120,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&auto=format',
    category: 'Beverages',
    tags: ['Drink', 'Refreshing'],
    available: true,
    prep_time: 5
  },
  {
    id: '5',
    name: 'Gulab Jamun',
    description: 'Deep-fried milk solids in sugar syrup',
    price: 90,
    calories: 280,
    image: 'https://images.unsplash.com/photo-1565559990261-233dfdd04246?w=500&auto=format',
    category: 'Desserts',
    tags: ['Vegetarian', 'Sweet'],
    available: true,
    prep_time: 10
  }
];

export { categories } from '@/types/menu';
