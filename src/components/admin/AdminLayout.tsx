'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Order, OrderStatus } from '@/types/order';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './AdminHeader';
import DashboardOverview from './DashboardOverview';
import MenuManagement from './MenuManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import FeedbackConsole from './FeedbackConsole';
import Settings from './Settings';
import OrdersPage from './OrdersPage';
import SlotsTimings from './SlotsTimings';
import InventoryAlerts from './InventoryAlerts';
import Payments from './Payments';
import StaffManagement from './StaffManagement';

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Get the current active tab based on the current route
  const pathname = usePathname();
  const getActiveTab = () => {
    const navItems = [
      { name: 'Dashboard Overview', path: '/admin/dashboard' },
      { name: 'Orders', path: '/admin/orders' },
      { name: 'Slots & Timings', path: '/admin/slots' },
      { name: 'Menu Management', path: '/admin/menu' },
      { name: 'Inventory & Stock Alerts', path: '/admin/inventory' },
      { name: 'Payments', path: '/admin/payments' },
      { name: 'Analytics & Insights', path: '/admin/analytics' },
      { name: 'Customer Feedback', path: '/admin/feedback' },
      { name: 'Canteen Staff Management', path: '/admin/staff' },
      { name: 'Settings', path: '/admin/settings' },
    ];
    
    const currentNavItem = navItems.find(item => pathname.startsWith(item.path));
    return currentNavItem?.name || 'Dashboard Overview';
  };

  const activeTab = getActiveTab();
  const [orders, setOrders] = useState<Order[]>([]);

  // Simulate loading orders
  useEffect(() => {
    // TODO: Replace with actual API call
    const mockOrders: Order[] = [];
    setOrders(mockOrders);
  }, []);

  const handleUpdateStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: newStatus,
              statusHistory: [
                ...(order.statusHistory || []),
                { status: newStatus, timestamp: new Date().toISOString(), message: `Status updated to ${newStatus}` }
              ]
            } 
          : order
      )
    );
  }, []);

  const renderContent = useCallback(() => {
    if (children) return children;
    
    switch (activeTab) {
      case 'Dashboard Overview':
        return <DashboardOverview orders={orders} onUpdateStatus={handleUpdateStatus} />;
      case 'Orders':
        return <OrdersPage />;
      case 'Slots & Timings':
        return <SlotsTimings />;
      case 'Menu Management':
        return <MenuManagement />;
      case 'Inventory & Stock Alerts':
        return <InventoryAlerts />;
      case 'Payments':
        return <Payments />;
      case 'Analytics & Insights':
        return <AnalyticsDashboard />;
      case 'Customer Feedback':
        return <FeedbackConsole />;
      case 'Canteen Staff Management':
        return <StaffManagement />;
      case 'Settings':
        return <Settings />;
      default:
        return <div className="text-white p-8">Coming Soon: {activeTab}</div>;
    }
  }, [activeTab, children, orders, handleUpdateStatus]);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#FF512F] rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F09819] rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#FFD700] rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-red-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-6000 { animation-delay: 6s; }
      `}</style>
      
      <div className="flex h-screen">
        <Sidebar 
          activeTab={activeTab} 
          isExpanded={sidebarOpen} 
          onToggleExpand={() => setSidebarOpen(!sidebarOpen)} 
        />
        <motion.main 
          className="flex-1 flex flex-col h-screen"
          initial={false}
          animate={{ 
            marginLeft: sidebarOpen ? 0 : -176 // -176px (256px - 80px)
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Header />
          <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 pt-2 custom-scrollbar">
            {renderContent()}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default AdminLayout;
