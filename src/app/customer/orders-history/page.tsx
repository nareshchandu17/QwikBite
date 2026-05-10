"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Calendar, Download } from "lucide-react";
interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
  payment: string;
  status: string;
  etaMinutes: number;
  deliveryPerson: unknown;
  feedbackGiven: boolean;
  rating?: number;
}
import { toast } from 'sonner';
import { useCustomerGuard } from '@/lib/auth/roleGuard'; // Add this import

// Mock order history data
const orderHistory: Order[] = [
  {
    id: "ORD-1000",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    items: [
      { id: "m4", name: "Saffron Biryani", qty: 1, price: 12.5, image: "/images/biryani.jpg" },
    ],
    total: 12.5,
    payment: "Card",
    status: "Delivered",
    etaMinutes: 0,
    deliveryPerson: null,
    feedbackGiven: true,
    rating: 5
  },
  {
    id: "ORD-0999",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    items: [
      { id: "m5", name: "Green Detox Salad", qty: 2, price: 7.5, image: "/images/salad.jpg" },
    ],
    total: 15.0,
    payment: "COD",
    status: "Cancelled",
    etaMinutes: 0,
    deliveryPerson: null,
    feedbackGiven: false
  },
  {
    id: "ORD-0998",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    items: [
      { id: "m6", name: "Chicken Burger", qty: 1, price: 9.99, image: "/images/burger.jpg" },
      { id: "m7", name: "French Fries", qty: 1, price: 3.99, image: "/images/fries.jpg" },
    ],
    total: 13.98,
    payment: "UPI",
    status: "Delivered",
    etaMinutes: 0,
    deliveryPerson: null,
    feedbackGiven: true,
    rating: 4
  },
  {
    id: "ORD-0997",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    items: [
      { id: "m8", name: "Margherita Pizza", qty: 1, price: 12.99, image: "/images/pizza.jpg" },
    ],
    total: 12.99,
    payment: "Card",
    status: "Delivered",
    etaMinutes: 0,
    deliveryPerson: null,
    feedbackGiven: false
  },
  {
    id: "ORD-0996",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    items: [
      { id: "m9", name: "Caesar Salad", qty: 1, price: 8.99, image: "/images/salad-2.jpg" },
      { id: "m10", name: "Iced Coffee", qty: 1, price: 4.50, image: "/images/coffee.jpg" },
    ],
    total: 13.49,
    payment: "Wallet",
    status: "Delivered",
    etaMinutes: 0,
    deliveryPerson: null,
    feedbackGiven: true,
    rating: 5
  }
];

export default function OrdersHistoryPage() {
  useCustomerGuard(); // Add this hook to protect the page
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter orders based on search and filters
  const filteredOrders = orderHistory.filter(order => {
    // Search filter
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case "last7":
          matchesDate = orderDate >= new Date(now.setDate(now.getDate() - 7));
          break;
        case "last30":
          matchesDate = orderDate >= new Date(now.setDate(now.getDate() - 30));
          break;
        case "last90":
          matchesDate = orderDate >= new Date(now.setDate(now.getDate() - 90));
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    toast.success("Exporting order history...");
    // In a real implementation, this would generate and download a CSV or PDF
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Order History</h1>
          <p className="text-slate-400 mt-1">View and manage your past orders</p>
        </div>
        
        <button 
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition mt-4 md:mt-0"
        >
          <Download className="w-4 h-4 mr-2" />
          Export History
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-700/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders or items..."
              className="pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full"
            />
          </div>
          
          {/* Date Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-400" />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full"
            >
              <option value="all">All Time</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full"
            >
              <option value="all">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Order History */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-white mb-2">No orders found</h3>
          <p className="text-slate-400">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-amber-500/30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-white">Order {order.id}</h3>
                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === "Delivered" 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <p className="text-slate-400 text-sm mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  
                  <div className="mt-3">
                    <p className="text-slate-300">
                      {order.items.map((item, index) => (
                        <span key={item.id}>
                          {item.qty}× {item.name}
                          {index < order.items.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">${order.total.toFixed(2)}</p>
                    <p className="text-slate-400 text-sm">{order.payment}</p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    {order.rating && (
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < (order.rating || 0) ? 'text-amber-400' : 'text-slate-600'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                    <button className="mt-2 text-sm text-amber-400 hover:text-amber-300 transition">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
