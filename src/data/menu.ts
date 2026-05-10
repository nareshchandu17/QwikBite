export interface MenuItem {
  _id?: string; // MongoDB ID from API
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;  // For displaying original price when there's a discount
  calories: number;
  image: string;
  category: string;
  tags: string[];
  available: boolean;
  prep_time?: number;  // Preparation time in minutes
  availability?: 'Available' | 'Unavailable';  // Availability status
  // Optional dietary/popularity flags used by the UI
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isPopular?: boolean;
  rating?: number;  // Optional rating out of 5
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
];

// Dietary options used by the filters UI
export const dietaryOptions = [
  { id: 'vegetarian', name: 'Vegetarian' },
  { id: 'vegan', name: 'Vegan' },
  { id: 'glutenFree', name: 'Gluten Free' },
  { id: 'dairyFree', name: 'Dairy Free' }
];

export const menuItems: MenuItem[] = [
  // Tiffins
  {
    id: '1',
    name: 'Idly',
    description: 'Soft and fluffy steamed rice cakes served with chutney and sambar',
    price: 30,
    calories: 120,
    image: 'https://images.pexels.com/photos/4331489/pexels-photo-4331489.jpeg',
    category: 'Tiffins',
    tags: ['South Indian', 'Breakfast'],
    available: true
  },
  {
    id: '2',
    name: 'Bajji',
    description: 'Crispy fritters made with gram flour and vegetables',
    price: 25,
    calories: 180,
    image: 'https://media.istockphoto.com/id/1306547668/photo/tasty-mysore-bonda-in-a-banana-leaf.webp?a=1&b=1&s=612x612&w=0&k=20&c=cEy1tubqb28sczOlrbGUshlwNpmaqzMvsnUldLF8mxE=',
    category: 'Tiffins',
    tags: ['South Indian', 'Snack'],
    available: true
  },
  {
    id: '3',
    name: 'Puri',
    description: 'Deep-fried bread served with potato curry',
    price: 40,
    calories: 300,
    image: 'https://media.istockphoto.com/id/1705124930/photo/food-photos-various-entrees-appetizers-deserts-etc.webp?a=1&b=1&s=612x612&w=0&k=20&c=5j3eZFBC4uOCej5OFxfvJw3hax2ZiLqx8G_r1fhNkP0=',
    category: 'Tiffins',
    tags: ['North Indian'],
    available: true
  },
  {
    id: '4',
    name: 'Chapathi',
    description: 'Whole wheat flatbread served with curry',
    price: 35,
    calories: 200,
    image: 'https://media.istockphoto.com/id/2159106869/photo/close-up-of-chickpeas-chana-masala-with-roti-or-chapati-on-a-wooden-table-chikpea-is-also.webp?a=1&b=1&s=612x612&w=0&k=20&c=R4MGSBv1M7CMzX74JmPbX_cPGfBr0YtGUE5pPAQgwCY=',
    category: 'Tiffins',
    tags: ['North Indian'],
    available: true
  },
  {
    id: '5',
    name: 'Parota',
    description: 'Layered flatbread served with curry',
    price: 45,
    calories: 280,
    image: 'https://media.istockphoto.com/id/1205482203/photo/kerala-parotta-popularly-known-as-paratha-or-porotta-is-a-delicacy-from-the-state-of-kerala.jpg?s=612x612&w=0&k=20&c=Yv6GQkzNErLM7NUA4q6S27FnFMT7yuC6RSCij5e2m0Y=',
    category: 'Tiffins',
    tags: ['South Indian'],
    available: true
  },
  {
    id: '6',
    name: 'Plain Dosa',
    description: 'Crispy rice crepe served with chutney and sambar',
    price: 40,
    calories: 180,
    image: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
    category: 'Tiffins',
    tags: ['South Indian'],
    available: true
  },
  {
    id: '7',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato',
    price: 60,
    calories: 250,
    image: 'https://media.istockphoto.com/id/942682776/photo/masala-dosa-indian-breakfast-crepes-with-spicy-potato-filling.webp?a=1&b=1&s=612x612&w=0&k=20&c=LM5nGfClVFYZDlyqqvUCahI6CJ1vN4DuggMIsbcYlBo=',
    category: 'Tiffins',
    tags: ['South Indian', 'Popular'],
    available: true
  },
  {
    id: '8',
    name: 'Egg Dosa',
    description: 'Dosa with beaten egg spread',
    price: 50,
    calories: 220,
    image: 'https://media.istockphoto.com/id/1152229281/photo/egg-dosa-anda-dosa.jpg?s=612x612&w=0&k=20&c=ZT_ML-NnZDi7WSsOewHmklxHUnU3pI5gqQtBuwJ99GU=',
    category: 'Tiffins',
    tags: ['South Indian', 'Egg'],
    available: true
  },
  {
    id: '9',
    name: 'Double Egg Dosa',
    description: 'Dosa with double portion of egg',
    price: 70,
    calories: 280,
    image: 'https://media.istockphoto.com/id/2210684292/photo/roti-canai.webp?a=1&b=1&s=612x612&w=0&k=20&c=R93ECSPgs7Fd1khlghUU82AcjPIBicM7XLfBJHuQVPc=',
    category: 'Tiffins',
    tags: ['South Indian', 'Egg'],
    available: true
  },
  {
    id: '10',
    name: 'Rava Dosa',
    description: 'Crispy semolina crepe',
    price: 55,
    calories: 200,
    image: 'https://media.istockphoto.com/id/525773217/photo/rava-dosa-in-plate-south-indian-snack-india.webp?a=1&b=1&s=612x612&w=0&k=20&c=IcBIzKGUGe52Tz_XjhdU5VMJ4pot2NUETi5kVSVHZXE=',
    category: 'Tiffins',
    tags: ['South Indian'],
    available: true
  },
  {
    id: '11',
    name: 'Minapattu Dosa',
    description: 'Special dosa variety with unique spice blend',
    price: 65,
    calories: 230,
    image: 'https://media.istockphoto.com/id/478090950/photo/masala-dosa-with-chutney-and-sambaar.webp?a=1&b=1&s=612x612&w=0&k=20&c=toFrkTe8PYuJQ5bz7--o_4_bcrmzscGWN6IVy_ZFXCA=',
    category: 'Tiffins',
    tags: ['South Indian', 'Special'],
    available: true
  },
  {
    id: '12',
    name: 'Pesarattu',
    description: 'Green gram dosa, a healthy breakfast option',
    price: 45,
    calories: 190,
    image: 'https://media.istockphoto.com/id/2177537591/photo/dosa.webp?a=1&b=1&s=612x612&w=0&k=20&c=mIGnBYrrOb9E76AfUXiRB_h2hR9jc4wdrslZjoxthuo=',
    category: 'Tiffins',
    tags: ['South Indian', 'Healthy'],
    available: true
  },

  // Fast Food
  {
    id: '13',
    name: 'Veg Fried Rice (Full)',
    description: 'Rice stir-fried with mixed vegetables',
    price: 120,
    calories: 450,
    image: 'https://media.istockphoto.com/id/2198480737/photo/image-of-egg-fried-rice-with-mixed-veg-sweet-sour-peppers-crispy-chicken-strips-classic.webp?a=1&b=1&s=612x612&w=0&k=20&c=tearh1SJHMA5l_RXxOHqBgfHhFiBsAroWR9wjcgxEQ8=',
    category: 'Fast Food',
    tags: ['Chinese', 'Full'],
    available: true
  },

  {
    id: '14',
    name: 'Egg Fried Rice (Full)',
    description: 'Rice stir-fried with eggs and vegetables',
    price: 140,
    calories: 500,
    image: 'https://media.istockphoto.com/id/1175434591/photo/fried-rice-with-ketchup-and-soy-sauce.webp?a=1&b=1&s=612x612&w=0&k=20&c=1vdfRph7NFQJGxqkY4BYOvGWX8lmRPjdpCeU6VygsTQ=',
    category: 'Fast Food',
    tags: ['Chinese', 'Egg', 'Full'],
    available: true
  },

  {
    id: '15',
    name: 'Chicken Fried Rice (Full)',
    description: 'Rice stir-fried with chicken and vegetables',
    price: 160,
    calories: 550,
    image: 'https://media.istockphoto.com/id/1444859690/photo/chicken-fried-rice.webp?a=1&b=1&s=612x612&w=0&k=20&c=_nEy3s8fVrMFU4upqHJBfuRvdmzHWR6IDrzTF-4s6xM=',
    category: 'Fast Food',
    tags: ['Chinese', 'Non-Veg', 'Full'],
    available: true
  },

  {
    id: '16',
    name: 'Veg Noodles (Full)',
    description: 'Stir-fried noodles with mixed vegetables',
    price: 110,
    calories: 400,
    image: 'https://media.istockphoto.com/id/1292637257/photo/veg-hakka-noodles-a-popular-oriental-dish-made-with-noodles-and-vegetables-served-over-a.webp?a=1&b=1&s=612x612&w=0&k=20&c=0xbbDCOhb_rLXHueLmoc0zBzmE8FR7xrDyvjflUlEQ8=',
    category: 'Fast Food',
    tags: ['Chinese', 'Full'],
    available: true
  },


  // Curries
  {
    id: '17',
    name: 'Chicken Curry',
    description: 'Spicy chicken curry',
    price: 120,
    calories: 350,
    image: 'https://media.istockphoto.com/id/1501040363/photo/chicken-curry-in-bowl-with-indian-spices.webp?a=1&b=1&s=612x612&w=0&k=20&c=-oQe3mGIl1GMv6eFXmwxFeopf-YeMoVFIFultBbgNdg=',
    category: 'Curries',
    tags: ['Non-Veg', 'Spicy'],
    available: true
  },
  {
    id: '18',
    name: 'Fish Curry',
    description: 'Traditional fish curry',
    price: 130,
    calories: 300,
    image: 'https://images.unsplash.com/photo-1626508035297-0cd27c397d67?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZmlzaCUyMGN1cnJ5fGVufDB8fDB8fHww',
    category: 'Curries',
    tags: ['Non-Veg', 'Seafood'],
    available: true
  },
  {
    id: '19',
    name: 'Egg Curry',
    description: 'Boiled eggs in spicy gravy',
    price: 90,
    calories: 280,
    image: 'https://media.istockphoto.com/id/1333216787/photo/close-up-of-egg-curry-or-masala-gravy.webp?a=1&b=1&s=612x612&w=0&k=20&c=sDzFflxd6fw-4Fs0t_hPwV8EaKl3fMd65-pPcublhSc=',
    category: 'Curries',
    tags: ['Egg'],
    available: true
  },
  {
    id: '20',
    name: 'Sambar',
    description: 'Traditional lentil and vegetable stew',
    price: 40,
    calories: 150,
    image: 'https://media.istockphoto.com/id/1391459257/photo/south-indian-famous-rasam-sambar-served-in-a-traditional-mud-pot-closeup-with-selective-focus.webp?a=1&b=1&s=612x612&w=0&k=20&c=jmnc6Om_TPasvPU2B_-C30bcG5dlZK-4QT23BEggxWc=',
    category: 'Curries',
    tags: ['South Indian', 'Veg'],
    available: true
  },
  {
    id: '21',
    name: 'Dal Tadka',
    description: 'Yellow lentils tempered with spices',
    price: 50,
    calories: 200,
    image: 'https://images.unsplash.com/photo-1626500155537-93690c24099e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZGFsJTIwdGFka2F8ZW58MHx8MHx8fDA%3D',
    category: 'Curries',
    tags: ['North Indian', 'Veg'],
    available: true
  },
  {
    id: '22',
    name: 'Paneer Butter Masala',
    description: 'Cottage cheese in rich tomato gravy',
    price: 100,
    calories: 400,
    image: 'https://media.istockphoto.com/id/1463279736/photo/cheese-cottage-curry.webp?a=1&b=1&s=612x612&w=0&k=20&c=kwSWPNejDyfc1T5VbR1nojZ54veqykkzEfP57XCfYsM=',
    category: 'Curries',
    tags: ['North Indian', 'Veg'],
    available: true
  },
  {
    id: '23',
    name: 'Mutton Curry',
    description: 'Spicy mutton curry',
    price: 150,
    calories: 450,
    image: 'https://media.istockphoto.com/id/1253934130/photo/mutton-masala-curry-in-plastic-container-for-home-delivery.webp?a=1&b=1&s=612x612&w=0&k=20&c=YfBWKFt3Zje8yRAlAdteLnL5vhJvCnf2Vj2CU2ytgE4=',
    category: 'Curries',
    tags: ['Non-Veg', 'Spicy'],
    available: true
  },
  {
    id: '24',
    name: 'Vegetable Kurma',
    description: 'Mixed vegetables in coconut gravy',
    price: 80,
    calories: 250,
    image: 'https://media.istockphoto.com/id/1298603264/photo/image-of-indian-butter-chicken-tikka-curry-served-in-turquoise-blue-cooking-pan-filled-with.webp?a=1&b=1&s=612x612&w=0&k=20&c=3UCYM-xsjGA6_yZ3lA9tmg_6md8lLkBspQ0FicjoddU=',
    category: 'Curries',
    tags: ['South Indian', 'Veg'],
    available: true
  },

  // Drinks
  {
    id: '25',
    name: 'Maaza (200ml)',
    description: 'Mango flavored drink',
    price: 20,
    calories: 150,
    image: 'https://images.pexels.com/photos/109275/pexels-photo-109275.jpeg',
    category: 'Drinks',
    tags: ['Cold', 'Mango'],
    available: true
  },
  {
    id: '26',
    name: 'Maaza (500ml)',
    description: 'Mango flavored drink - medium',
    price: 35,
    calories: 375,
    image: 'https://images.unsplash.com/photo-1657600704994-ea5020a66231?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFhemF8ZW58MHx8MHx8fDA%3D',
    category: 'Drinks',
    tags: ['Cold', 'Mango'],
    available: true
  },
  {
    id: '27',
    name: 'Sprite (200ml)',
    description: 'Lemon-lime carbonated drink',
    price: 35,
    calories: 350,
    image: 'https://images.unsplash.com/photo-1680404005217-a441afdefe83?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3ByaXRlfGVufDB8fDB8fHww',
    category: 'Drinks',
    tags: ['Cold', 'Carbonated'],
    available: true
  },
  {
    id: '28',
    name: '7UP (200ml)',
    description: 'Lemon-lime carbonated drink',
    price: 35,
    calories: 350,
    image: 'https://images.unsplash.com/photo-1624517286326-62fc932dffca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8N3VwfGVufDB8fDB8fHww',
    category: 'Drinks',
    tags: ['Cold', 'Carbonated'],
    available: true
  },
  {
    id: '29',
    name: 'Thumbs Up (200ml)',
    description: 'Indian cola flavored drink',
    price: 35,
    calories: 350,
    image: 'https://images.unsplash.com/photo-1610873167013-2dd675d30ef4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dGh1bXN1cCUyMGRyaW5rJTIwYm90dGxlJTIwMjAwbWx8ZW58MHx8MHx8fDA%3D',
    category: 'Drinks',
    tags: ['Cold', 'Carbonated'],
    available: true
  },
  {
    id: '30',
    name: 'Coca Cola (200ml)',
    description: 'Classic cola drink',
    price: 35,
    calories: 350,
    image: 'https://images.unsplash.com/photo-1704603399080-d09992e10a40?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGNvY29jb2xhJTIwZHJpbmslMjBib3R0bGUlMjAyMDBtbHxlbnwwfHwwfHx8MA%3D%3D',
    category: 'Drinks',
    tags: ['Cold', 'Carbonated'],
    available: true
  },
  {
    id: '31',
    name: 'Pepsi (200ml)',
    description: 'Classic cola drink',
    price: 35,
    calories: 350,
    image: 'https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGVwc2l8ZW58MHx8MHx8fDA%3D',
    category: 'Drinks',
    tags: ['Cold', 'Carbonated'],
    available: true
  },
  {
    id: '32',
    name: 'Fanta (200ml)',
    description: 'Orange flavored carbonated drink',
    price: 35,
    calories: 350,
    image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZmFudGF8ZW58MHx8MHx8fDA%3D',
    category: 'Drinks',
    tags: ['Cold', 'Carbonated'],
    available: true
  },

  // Juices
  {
    id: '33',
    name: 'Banana Juice',
    description: 'Fresh banana juice',
    price: 40,
    calories: 150,
    image: 'https://images.pexels.com/photos/1337826/pexels-photo-1337826.jpeg',
    category: 'Juices',
    tags: ['Fresh', 'Healthy'],
    available: true
  },
  {
    id: '34',
    name: 'Pineapple Juice',
    description: 'Fresh pineapple juice',
    price: 45,
    calories: 120,
    image: 'https://images.pexels.com/photos/2789328/pexels-photo-2789328.jpeg',
    category: 'Juices',
    tags: ['Fresh', 'Healthy'],
    available: true
  },
  {
    id: '35',
    name: 'Orange Juice',
    description: 'Fresh orange juice',
    price: 40,
    calories: 110,
    image: 'https://images.pexels.com/photos/158053/fresh-orange-juice-squeezed-refreshing-citrus-158053.jpeg',
    category: 'Juices',
    tags: ['Fresh', 'Healthy'],
    available: true
  },
  {
    id: '36',
    name: 'Watermelon Juice',
    description: 'Fresh watermelon juice',
    price: 35,
    calories: 100,
    image: 'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg',
    category: 'Juices',
    tags: ['Fresh', 'Summer'],
    available: true
  },
  {
    id: '37',
    name: 'Apple Juice',
    description: 'Fresh apple juice',
    price: 45,
    calories: 120,
    image: 'https://images.pexels.com/photos/1337824/pexels-photo-1337824.jpeg',
    category: 'Juices',
    tags: ['Fresh', 'Healthy'],
    available: true
  },
  {
    id: '38',
    name: 'Grape Juice',
    description: 'Fresh grape juice',
    price: 40,
    calories: 110,
    image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3JhcGUlMjBqdWljZXxlbnwwfHwwfHx8MA%3D%3D',
    category: 'Juices',
    tags: ['Fresh', 'Healthy'],
    available: true
  },
  {
    id: '39',
    name: 'Pomegranate Juice',
    description: 'Fresh pomegranate juice',
    price: 50,
    calories: 130,
    image: 'https://media.istockphoto.com/id/1088035806/photo/sweet-pomegranate-juice.webp?a=1&b=1&s=612x612&w=0&k=20&c=YuGIAVotDkgawAZF0e3RY0pzbdDCtWkg9ry0ApB-6JY=',
    category: 'Juices',
    tags: ['Fresh', 'Healthy'],
    available: true
  },
  {
    id: '40',
    name: 'Mango Juice',
    description: 'Fresh mango juice',
    price: 45,
    calories: 140,
    image: 'https://images.unsplash.com/photo-1697642452436-9c40773cbcbb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFuZ28lMjBqdWljZXxlbnwwfHwwfHx8MA%3D%3D',
    category: 'Juices',
    tags: ['Fresh', 'Summer'],
    available: true
  },

  // Mocktails
  {
    id: '41',
    name: 'Virgin Mojito',
    description: 'Mint and lime refresher',
    price: 60,
    calories: 120,
    image: 'https://images.pexels.com/photos/4021983/pexels-photo-4021983.jpeg',
    category: 'Mocktails',
    tags: ['Refreshing', 'Popular'],
    available: true
  },
  {
    id: '42',
    name: 'Blue Lagoon',
    description: 'Blue curacao flavored mocktail',
    price: 70,
    calories: 150,
    image: 'https://images.pexels.com/photos/2795026/pexels-photo-2795026.jpeg',
    category: 'Mocktails',
    tags: ['Sweet', 'Colorful'],
    available: true
  },
  {
    id: '43',
    name: 'Mango Tango',
    description: 'Fresh mango based mocktail',
    price: 65,
    calories: 140,
    image: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg',
    category: 'Mocktails',
    tags: ['Sweet', 'Fruity'],
    available: true
  },
  {
    id: '44',
    name: 'Strawberry Delight',
    description: 'Fresh strawberry based mocktail',
    price: 70,
    calories: 130,
    image: 'https://media.istockphoto.com/id/670233246/photo/fresh-strawberry-juice.webp?a=1&b=1&s=612x612&w=0&k=20&c=WWqIkHaFMUzBBOs0eEkBcbdiVWjLgfrDR2PJtFLIhqI=',
    category: 'Mocktails',
    tags: ['Sweet', 'Fruity'],
    available: true
  },

  // Hot N Crunch
  {
    id: '45',
    name: 'Margherita Pizza',
    description: 'Classic tomato and cheese pizza',
    price: 150,
    calories: 800,
    image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg',
    category: 'Hot N Crunch',
    tags: ['Italian', 'Vegetarian'],
    available: true
  },
  {
    id: '46',
    name: 'Chicken Burger',
    description: 'Chicken patty burger with fresh veggies',
    price: 100,
    calories: 500,
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
    category: 'Hot N Crunch',
    tags: ['Fast Food', 'Non-Veg'],
    available: true
  },
  {
    id: '47',
    name: 'Veg Burger',
    description: 'Mixed vegetable patty burger',
    price: 80,
    calories: 450,
    image: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg',
    category: 'Hot N Crunch',
    tags: ['Fast Food', 'Vegetarian'],
    available: true
  },
  {
    id: '48',
    name: 'French Fries',
    description: 'Crispy potato fries',
    price: 60,
    calories: 300,
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg',
    category: 'Hot N Crunch',
    tags: ['Crispy', 'Popular'],
    available: true
  },
  {
    id: '49',
    name: 'Chicken Wings',
    description: 'Crispy fried chicken wings',
    price: 120,
    calories: 400,
    image: 'https://media.istockphoto.com/id/1451323978/photo/baked-chicken-wings-with-sweet-chili-sauce-in-a-plate-black-background-top-view.webp?a=1&b=1&s=612x612&w=0&k=20&c=16utPxh1GnWO1lPSMPHAuKQWGvU_MEVa4_HIS4VapjE=',
    category: 'Hot N Crunch',
    tags: ['Crispy', 'Non-Veg'],
    available: true
  },
  {
    id: '50',
    name: 'Onion Rings',
    description: 'Crispy fried onion rings',
    price: 50,
    calories: 250,
    image: 'https://media.istockphoto.com/id/451682899/photo/homemade-crunchy-fried-onion-rings.webp?a=1&b=1&s=612x612&w=0&k=20&c=phM_u8dam8MssyVrc50ij5aNq7reOuy9nHk7cZq-clc=',
    category: 'Hot N Crunch',
    tags: ['Crispy', 'Vegetarian'],
    available: true
  },
  {
    id: '51',
    name: 'Chicken Nuggets',
    description: 'Crispy chicken nuggets',
    price: 90,
    calories: 350,
    image: 'https://images.pexels.com/photos/1583887/pexels-photo-1583887.jpeg',
    category: 'Hot N Crunch',
    tags: ['Crispy', 'Non-Veg'],
    available: true
  },
  {
    id: '52',
    name: 'Cheese Balls',
    description: 'Crispy cheese balls',
    price: 70,
    calories: 300,
    image: 'https://media.istockphoto.com/id/609932320/photo/fried-mac-and-cheese-balls-selective-focus.jpg?s=612x612&w=0&k=20&c=kuYowih6LnbXiIEgWQoXNU2ZcJrZEQP7w4Ck4WhwsK0=',
    category: 'Hot N Crunch',
    tags: ['Crispy', 'Vegetarian'],
    available: true
  },

  // Snacks
  {
    id: '53',
    name: 'Biscuits',
    description: 'Assorted biscuits and cookies',
    price: 20,
    calories: 150,
    image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg',
    category: 'Snacks',
    tags: ['Light', 'Snack'],
    available: true
  },
  {
    id: '54',
    name: 'Chips',
    description: 'Variety of potato chips',
    price: 20,
    calories: 160,
    image: 'https://images.pexels.com/photos/568805/pexels-photo-568805.jpeg',
    category: 'Snacks',
    tags: ['Crispy', 'Snack'],
    available: true
  },
  {
    id: '55',
    name: 'Popcorn',
    description: 'Freshly popped buttered popcorn',
    price: 30,
    calories: 120,
    image: 'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg',
    category: 'Snacks',
    tags: ['Light', 'Snack'],
    available: true
  },
  {
    id: '56',
    name: 'Chocolate Bars',
    description: 'Selection of chocolate bars',
    price: 40,
    calories: 250,
    image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg',
    category: 'Snacks',
    tags: ['Sweet', 'Snack'],
    available: true
  },
  {
    id: '57',
    name: 'Nuts Mix',
    description: 'Assorted nuts and dry fruits',
    price: 50,
    calories: 200,
    image: 'https://media.istockphoto.com/id/1947360553/photo/adadiya-pak-m-2.webp?a=1&b=1&s=612x612&w=0&k=20&c=T-vJiJsdz_h_QBT9GuPGZOULrDVCfijw1CL1IkNcDjc=',
    category: 'Snacks',
    tags: ['Healthy', 'Snack'],
    available: true
  },
  {
    id: '58',
    name: 'Energy Bars',
    description: 'Healthy energy bars',
    price: 45,
    calories: 180,
    image: 'https://plus.unsplash.com/premium_photo-1726567911506-63e27d23f017?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGVuZXJneSUyMGJhcnN8ZW58MHx8MHx8fDA%3D',
    category: 'Snacks',
    tags: ['Healthy', 'Snack'],
    available: true
  },
  {
    id: '59',
    name: 'Cream Bun',
    description: 'A soft,fluffy bun with sweet cream',
    price: 25,
    calories: 140,
    image: 'https://media.istockphoto.com/id/1879863588/photo/colorful-delicious-tasty-dessert-doughnut.jpg?s=612x612&w=0&k=20&c=KwK1IpF_XbP-mLsIz2gTFrZphz6B9ul6DWMCUg2Z3LU=',
    category: 'Snacks',
    tags: ['Light', 'Snack'],
    available: true
  },
  {
    id: '60',
    name: 'Ice Cream',
    description: 'Mixed nuts and dried fruits',
    price: 55,
    calories: 220,
    image: 'https://media.istockphoto.com/id/157472912/photo/ice-cream-composition-on-a-bowl.webp?a=1&b=1&s=612x612&w=0&k=20&c=e1yPCusQJl2scx955yuv9LUcbx5e7OcARC_VgEDdz5Y=',
    category: 'Snacks',
    tags: ['Healthy', 'Snack'],
    available: true
  },

  // Tea Corner
  {
    id: '61',
    name: 'Masala Chai',
    description: 'Indian spiced tea',
    price: 15,
    calories: 100,
    image: 'https://images.unsplash.com/photo-1683533698664-12ee473e8c9d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFzYWxhJTIwdGVhfGVufDB8fDB8fHww',
    category: 'Tea Corner',
    tags: ['Hot', 'Indian'],
    available: true
  },
  {
    id: '62',
    name: 'Green Tea',
    description: 'Healthy green tea',
    price: 20,
    calories: 5,
    image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z3JlZW4lMjB0ZWF8ZW58MHx8MHx8fDA%3D',
    category: 'Tea Corner',
    tags: ['Hot', 'Healthy'],
    available: true
  },
  {
    id: '63',
    name: 'Black Tea',
    description: 'Classic black tea',
    price: 15,
    calories: 40,
    image: 'https://media.istockphoto.com/id/1222504396/photo/tea-and-tea-leaves.webp?a=1&b=1&s=612x612&w=0&k=20&c=7x_3863rhFJC-nVTgB6EdwH0yK2cKRkWtpxLW9riXPI=',
    category: 'Tea Corner',
    tags: ['Hot', 'Classic'],
    available: true
  },
  {
    id: '64',
    name: 'Ginger Tea',
    description: 'Tea with fresh ginger',
    price: 20,
    calories: 60,
    image: 'https://media.istockphoto.com/id/2187800624/photo/ginger-tea-with-lemon.webp?a=1&b=1&s=612x612&w=0&k=20&c=t2qzyi4DCHBDsNsEOYwYHbo1_F8z5owwJL7XJ_Zefzo=',
    category: 'Tea Corner',
    tags: ['Hot', 'Spiced'],
    available: true
  },
  {
    id: '65',
    name: 'Lemon Tea',
    description: 'Tea with fresh lemon',
    price: 20,
    calories: 50,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGVtb24lMjB0ZWF8ZW58MHx8MHx8fDA%3D',
    category: 'Tea Corner',
    tags: ['Hot', 'Refreshing'],
    available: true
  },
  {
    id: '66',
    name: 'Cardamom Tea',
    description: 'Tea with cardamom flavor',
    price: 25,
    calories: 70,
    image: 'https://media.istockphoto.com/id/1287066793/photo/tea-or-chai-tea-on-wooden-board-with-spices-cozy-hot-drink.webp?a=1&b=1&s=612x612&w=0&k=20&c=6cYbbk4kGzX3TehCRCCxhmTrB7b7qf5WsBS0TbqZ0ZU=',
    category: 'Tea Corner',
    tags: ['Hot', 'Spiced'],
    available: true
  },
  {
    id: '67',
    name: 'Mint Tea',
    description: 'Tea with fresh mint',
    price: 20,
    calories: 45,
    image: 'https://images.unsplash.com/photo-1617278336296-c1b8b5959745?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8bWludCUyMHRlYXxlbnwwfHwwfHx8MA%3D%3D',
    category: 'Tea Corner',
    tags: ['Hot', 'Refreshing'],
    available: true
  },
  {
    id: '68',
    name: 'Honey Tea',
    description: 'Tea with honey',
    price: 25,
    calories: 80,
    image: 'https://media.istockphoto.com/id/1291814237/photo/hot-herbal-tea-with-ginger-lemon-and-honey.webp?a=1&b=1&s=612x612&w=0&k=20&c=9pyoEgi-BrpnFGfRArlbDaBHyk88zo4HcFLAqK1qsbU=',
    category: 'Tea Corner',
    tags: ['Hot', 'Sweet'],
    available: true
  }
];