// Campus Favorites Data
// This data can be easily updated weekly or replaced with dynamic data from an API

export interface CampusFavoriteItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
}

// Campus favorites data - using actual menu items from menu.ts
const campusFavorites: CampusFavoriteItem[] = [
  // Idly (from menu.ts)
  {
    id: '1',
    name: 'Idly',
    description: 'Soft and fluffy steamed rice cakes served with chutney and sambar',
    price: 30,
    image: 'https://images.pexels.com/photos/4331489/pexels-photo-4331489.jpeg',
    category: 'Tiffins',
    rating: 4.7,
  },
  // Veg Fried Rice (Full) from menu.ts
  {
    id: '13',
    name: 'chicken curry',
    description: 'Spicy chicken curry',
    price: 120,
    image:'https://media.istockphoto.com/id/1501040363/photo/chicken-curry-in-bowl-with-indian-spices.webp?a=1&b=1&s=612x612&w=0&k=20&c=-oQe3mGIl1GMv6eFXmwxFeopf-YeMoVFIFultBbgNdg=',
    category: 'Curries',
    rating: 4.5,
  },
  // Butter Chicken from menu.ts
  {
    id: '19',
    name: 'Chicken Fried Rice (Full)',
    description: 'Rice stir-fried with chicken and vegetables',
    price: 220,
    image: 'https://media.istockphoto.com/id/1444859690/photo/chicken-fried-rice.webp?a=1&b=1&s=612x612&w=0&k=20&c=_nEy3s8fVrMFU4upqHJBfuRvdmzHWR6IDrzTF-4s6xM=',
    category: 'Main Course',
    rating: 4.8,
  },
  // Sambar from menu.ts
  {
    id: '5',
    name: 'Sambar',
    description: 'South Indian lentil stew with vegetables and tamarind',
    price: 40,
    image: 'https://media.istockphoto.com/id/1391459257/photo/south-indian-famous-rasam-sambar-served-in-a-traditional-mud-pot-closeup-with-selective-focus.webp?a=1&b=1&s=612x612&w=0&k=20&c=jmnc6Om_TPasvPU2B_-C30bcG5dlZK-4QT23BEggxWc=',
    category: 'Side Dish',
    rating: 4.6,
  },
  // Banana Milkshake from menu.ts
  {
    id: '40',
    name: 'Banana juice',
    description: 'Fresh banana juice',
    price: 60,
    image: 'https://images.pexels.com/photos/1337826/pexels-photo-1337826.jpeg',
    category: 'Beverages',
    rating: 4.4,
  },
  // French Fries from menu.ts
  {
    id: '55',
    name: 'French Fries',
    description: 'Crispy golden potato fries served with ketchup',
    price: 70,
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg',
    category: 'Snacks',
    rating: 4.3,
  },
  // Masala Chips from menu.ts (closest to Chips)
  {
    id: '56',
    name: 'Masala Chips',
    description: 'Crispy potato chips with Indian spices',
    price: 50,
    image: 'https://images.pexels.com/photos/568805/pexels-photo-568805.jpeg',
    category: 'Snacks',
    rating: 4.2,
  },
  // Ice Cream from menu.ts
  {
    id: '65',
    name: 'Ice Cream',
    description: 'Vanilla ice cream with chocolate sauce and nuts',
    price: 60,
    image: 'https://media.istockphoto.com/id/157472912/photo/ice-cream-composition-on-a-bowl.webp?a=1&b=1&s=612x612&w=0&k=20&c=e1yPCusQJl2scx955yuv9LUcbx5e7OcARC_VgEDdz5Y=',
    category: 'Desserts',
    rating: 4.9,
  },
  // Ginger Tea from menu.ts
  {
    id: '69',
    name: 'Ginger Tea',
    description: 'Hot tea with fresh ginger and honey',
    price: 25,
    image: 'https://media.istockphoto.com/id/2187800624/photo/ginger-tea-with-lemon.webp?a=1&b=1&s=612x612&w=0&k=20&c=t2qzyi4DCHBDsNsEOYwYHbo1_F8z5owwJL7XJ_Zefzo=',
    category: 'Beverages',
    rating: 4.5,
  },
  // Lemon Tea from menu.ts (closest to Mint Tea)
  {
    id: '70',
    name: 'Lemon Tea',
    description: 'Refreshing tea with fresh lemon and honey',
    price: 25,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGVtb24lMjB0ZWF8ZW58MHx8MHx8fDA%3D',
    category: 'Tea Corner',
    rating: 4.6,
  },
];

export default campusFavorites;