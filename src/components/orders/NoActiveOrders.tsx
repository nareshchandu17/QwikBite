'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ForkKnife, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';

const floatingItems = [
  { emoji: '🍕', top: '10%', left: '15%' },
  { emoji: '🍔', top: '20%', right: '10%' },
  { emoji: '🍦', bottom: '15%', left: '10%' },
  { emoji: '🍜', bottom: '10%', right: '15%' },
  { emoji: '🥐', top: '50%', right: '5%' }
];

export default function NoActiveOrders() {
  const router = useRouter();

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#050505] to-[#0a0a0a] text-center text-white">
      {/* Floating Food Emojis */}
      {floatingItems.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl opacity-40 select-none"
          style={{ ...item }}
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3 + index, repeat: Infinity, ease: 'easeInOut' }}
        >
          {item.emoji}
        </motion.div>
      ))}    

      {/* Central Content */}
      <motion.div
        className="z-10 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ForkKnife className="w-8 h-8 text-white/80" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-2">No Active Orders Right Now!</h1>
        <p className="text-gray-400 mb-8">
          There&apos;s currently no order being prepared. You can explore the menu or view your past orders.
        </p>

        <div className="flex gap-4">
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-lg shadow-md cursor-pointer"
            onClick={() => router.push('/menu')}
          >
            <ForkKnife className="w-4 h-4 mr-2" /> Go to Menu
          </Button>

          <Button 
            className="bg-[#1c1c1e] hover:bg-[#2a2a2c] text-white font-medium px-6 py-2 rounded-lg border border-white/10 cursor-pointer"
            onClick={() => router.push('/orders')}
          >
            <ClipboardList className="w-4 h-4 mr-2" /> View Orders
          </Button>
        </div>
      </motion.div>

      {/* Green Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[400px] h-[400px] bg-green-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
