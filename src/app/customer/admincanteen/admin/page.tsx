'use client';

import { useAdminGuard } from '@/lib/auth/roleGuard';
import { motion } from 'framer-motion';
import { Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

export default function AdminDashboard() {
  useAdminGuard();
  
  const stats = [
    {
      title: "Total Orders",
      value: "1,234",
      icon: <ShoppingCart className="w-6 h-6" />,
      change: "+12% from last month",
      color: "bg-blue-500"
    },
    {
      title: "Total Revenue",
      value: "$12,345",
      icon: <DollarSign className="w-6 h-6" />,
      change: "+18% from last month",
      color: "bg-green-500"
    },
    {
      title: "Active Users",
      value: "567",
      icon: <Users className="w-6 h-6" />,
      change: "+5% from last month",
      color: "bg-amber-500"
    },
    {
      title: "Menu Items",
      value: "89",
      icon: <Package className="w-6 h-6" />,
      change: "No change",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 mb-8">Welcome to the admin panel. Here you can manage your canteen operations.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">{stat.change}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">Order #{1000 + item}</p>
                      <p className="text-sm text-gray-500">2 items • ${25.99 + item * 2}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Delivered
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Items</h2>
              <div className="space-y-4">
                {['Burger', 'Pizza', 'Salad', 'Pasta', 'Sandwich'].map((item, index) => (
                  <div key={item} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item}</p>
                      <p className="text-sm text-gray-500">{15 - index * 2} orders this week</p>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${100 - index * 15}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}