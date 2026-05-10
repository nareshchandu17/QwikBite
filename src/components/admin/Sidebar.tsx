
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';
import { AnalyticsIcon, DashboardIcon, FeedbackIcon, InventoryIcon, MenuIcon as MenuManagementIcon, OrdersIcon, PaymentsIcon, SettingsIcon, SlotsIcon, StaffIcon } from './icons';

interface SidebarProps {
  activeTab: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const navItems = [
  { name: 'Dashboard Overview', path: '/admin/dashboard', icon: DashboardIcon },
  { name: 'Orders', path: '/admin/orders', icon: OrdersIcon },
  { name: 'Slots & Timings', path: '/admin/slots', icon: SlotsIcon },
  { name: 'Menu Management', path: '/admin/menu', icon: MenuManagementIcon },
  { name: 'Inventory & Stock Alerts', path: '/admin/inventory', icon: InventoryIcon },
  { name: 'Payments', path: '/admin/payments', icon: PaymentsIcon },
  { name: 'Analytics & Insights', path: '/admin/analytics', icon: AnalyticsIcon },
  { name: 'Customer Feedback', path: '/admin/feedback', icon: FeedbackIcon },
  { name: 'Canteen Staff Management', path: '/admin/staff', icon: StaffIcon },
  { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
];

const NavItem: React.FC<{ 
  name: string; 
  icon: React.FC<React.SVGProps<SVGSVGElement>>; 
  isActive: boolean; 
  href: string;
  isCollapsed: boolean;
}> = ({ name, icon: Icon, isActive, href, isCollapsed }) => {
  return (
    <li className="relative group">
      <Link
        href={href}
        className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 relative ${isCollapsed ? 'justify-center' : ''} hover:bg-white/5 cursor-pointer z-10`}
      >
        {isActive && (
          <div className="absolute -left-4 w-1 h-8 bg-[#F09819] rounded-r-full" />
        )}
        <div className={`
          absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
          ${isActive ? 'bg-[#FF512F]/30 opacity-100' : 'bg-white/10'}
        `}></div>
        <div className="relative flex items-center w-full">
          <Icon className={`
            w-7 h-7 transition-colors duration-200 
            ${isActive ? 'text-[#F09819]' : 'text-[#9ca3af]'}
            ${isCollapsed ? 'mx-auto' : ''}
          `} />
          {!isCollapsed && (
            <span className={`ml-4 font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-[#9ca3af] group-hover:text-white'}`}>
              {name}
            </span>
          )}
        </div>
        
        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {name}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
          </div>
        )}
      </Link>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, isExpanded = false, onToggleExpand }) => {
  const toggleSidebar = () => {
    onToggleExpand?.();
  };

  return (
    <aside 
      className={`bg-[rgba(20,20,20,0.6)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] mt-4 mb-4 ml-4 mr-0 rounded-2xl p-4 flex-shrink-0 flex flex-col relative z-[100] transition-all duration-200`}
      style={{ width: isExpanded ? '256px' : '80px' }}
    >
      {/* Logo/Brand */}
      <div className="flex items-center justify-between mb-10 h-12">
        {isExpanded ? (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF512F] to-[#F09819]">
              qwikBite
            </h1>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <img 
              src="/images/favicon_enhanced.ico" 
              alt="qwikBite" 
              className="w-8 h-8 rounded cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={toggleSidebar}
              title="Open sidebar"
            />
          </div>
        )}
        
        {/* Toggle Icon for Expanded State */}
        {isExpanded && (
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors duration-200 cursor-pointer"
            title="Close sidebar"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul>
          {navItems.map(item => (
            <NavItem
              key={item.name}
              name={item.name}
              icon={item.icon}
              isActive={activeTab === item.name}
              href={item.path}
              isCollapsed={!isExpanded}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
