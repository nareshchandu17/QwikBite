import React from "react";
import { Plus, Star } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

/* =======================
   Inline Types (replaced import)
======================= */
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  tags?: string[];
}

export interface RecommendationResponse {
  dish: string;
  reasoning: string;
  estimatedWaitTime: string;
}

/* =======================
   Data
======================= */
const TRENDING_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Hot Puri Bhaji",
    price: 40,
    rating: 4.8,
    category: "Breakfast",
    image:
      "https://media.istockphoto.com/id/1705124930/photo/food-photos-various-entrees-appetizers-deserts-etc.webp?a=1&b=1&s=612x612&w=0&k=20&c=5j3eZFBC4uOCej5OFxfvJw3hax2ZiLqx8G_r1fhNkP0=",
  },
  {
    id: "2",
    name: "Chicken Curry",
    price: 100,
    rating: 4.9,
    category: "Lunch",
    image:
      "https://media.istockphoto.com/id/1501040363/photo/chicken-curry-in-bowl-with-indian-spices.webp?a=1&b=1&s=612x612&w=0&k=20&c=-oQe3mGIl1GMv6eFXmwxFeopf-YeMoVFIFultBbgNdg=",
  },
  {
    id: "3",
    name: "Blue Lagoon",
    price: 70,
    rating: 4.7,
    category: "Mocktail",
    image:
      "https://images.pexels.com/photos/2795026/pexels-photo-2795026.jpeg",
  },
  {
    id: "4",
    name: "Butter Popcorn",
    price: 50,
    rating: 4.6,
    category: "Snacks",
    image:
      "https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg",
  },
  {
    id: "5",
    name: "Vanilla Ice Cream",
    price: 50,
    rating: 4.5,
    category: "Dessert",
    image:
      "https://media.istockphoto.com/id/157472912/photo/ice-cream-composition-on-a-bowl.webp?a=1&b=1&s=612x612&w=0&k=20&c=e1yPCusQJl2scx955yuv9LUcbx5e7OcARC_VgEDdz5Y=",
  },
  {
    id: '6',
    name: 'Watermelon Juice',
    price: 40,
    rating : 4.7,
    image: 'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg',
    category: 'Juices',

  },
  {
    id: "7",
    name: "Dal Tadka",
    price: 20,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1626500155537-93690c24099e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZGFsJTIwdGFka2F8ZW58MHx8MHx8fDA%3D',
    category: 'Curries',
  },
  {
    id: "8",
    name: "Ginger Tea",
    price: 25,
    rating: 4.9,
    category: "Beverage",
    image:
      "https://media.istockphoto.com/id/2187800624/photo/ginger-tea-with-lemon.webp?a=1&b=1&s=612x612&w=0&k=20&c=t2qzyi4DCHBDsNsEOYwYHbo1_F8z5owwJL7XJ_Zefzo=",
  },
];

/* =======================
   Component
======================= */
export const TrendingSection: React.FC = () => {
   const { openModal } = useAuthModal();
   const router = useRouter();

   const handleOrderNow = (itemName: string) => {
     // Show toast immediately
     toast(
       <div className="flex items-center gap-3">
         <span className="text-2xl">🔐</span>
         <div>
           <div className="font-semibold text-white">Please sign in to place your order</div>
           <div className="text-sm text-gray-200">You need to be logged in to continue</div>
         </div>
       </div>,
       {
         duration: 3000, // Auto-dismiss in 3s
         style: {
           background: '#1f2937',
           color: '#ffffff',
           border: 'none',
           borderRadius: '0.75rem',
         },
       }
     );
   };

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10 flex items-end justify-between">
        <div>
          <h2 className="font-bold text-3xl md:text-4xl text-[#121212] mb-2 font-['Syne']">
            Trending on Campus <span className="text-[#FF5E1E]">🔥</span>
          </h2>
          <p className="text-[#6B7280] font-medium">
            Top picks everyone is queuing for.
          </p>
        </div>

        <Link
          href="/menu"
          className="hidden md:block font-bold text-[#FF5E1E] hover:underline"
        >
          View Full Menu
        </Link>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex overflow-x-auto gap-6 px-6 pb-8 snap-x snap-mandatory hide-scrollbar">
        {TRENDING_ITEMS.map((item) => (
          <div
            key={item.id}
            className="min-w-[280px] md:min-w-[320px] bg-[#F4F4F5] rounded-3xl snap-center group hover:bg-white hover:shadow-[0_0_0_1px_rgba(255,94,30,0.2),0_0_20px_rgba(255,94,30,0.15),0_0_40px_rgba(255,94,30,0.1)] transition-all duration-300 relative overflow-hidden"
          >
            <div className="relative h-48 rounded-t-3xl overflow-hidden">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />

              <div className="
  absolute top-3 right-3 z-10
  flex items-center gap-1.5
  bg-black/85 backdrop-blur
  px-3 py-1.5
  rounded-full
  text-white text-sm font-bold
  shadow-lg shadow-black/30
">
  <Star
    size={14}
    className="text-[#FFC700] fill-[#FFC700]"
  />
  <span className="leading-none">{item.rating}</span>
</div>


              <div className="absolute bottom-3 left-3 bg-[#121212]/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                {item.category}
              </div>
            </div>

            <div className="p-4">
              <div className="flex justify-between items-center mt-2">
              <h3 className="font-bold text-xl text-[#121212] group-hover:text-[#FF5E1E] transition-colors font-['Syne']">
                {item.name}
              </h3>

              <p className="text-[#6B7280] font-bold text-lg">₹{item.price}</p>
            </div>

            <button className="w-full mt-3 py-3 rounded-xl bg-white border-2 border-[#FF5E1E] text-[#FF5E1E] font-bold flex items-center justify-center gap-2 group-hover:bg-[#FF5E1E] group-hover:text-white transition-all cursor-pointer"
              onClick={() => handleOrderNow(item.name)}
            >
              <Plus size={18} /> Order Now
            </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};