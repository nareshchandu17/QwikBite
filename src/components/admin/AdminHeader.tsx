'use client';

import { useState, useEffect } from 'react';
import { NotificationIcon, ChevronDownIcon } from './icons';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  setActiveTab?: (tab: string) => void;
  activeTab?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, setActiveTab }) => {
  const [hasNewNotification, setHasNewNotification] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 3000); // pulse for 3 seconds
    }, 15000); // new notification every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Mock Notifications
  const notifications = [
    { id: 1, text: 'New Order #2024 received', time: 'Just now', tab: 'Orders', type: 'order' },
    { id: 2, text: 'Potato stock running low', time: '5 mins ago', tab: 'Inventory & Stock Alerts', type: 'alert' },
    { id: 3, text: 'New feedback from Priya', time: '1 hour ago', tab: 'Customer Feedback', type: 'info' },
  ];

  const handleNotifClick = (tab: string) => {
    if (setActiveTab) setActiveTab(tab);
    setIsNotifOpen(false);
    setHasNewNotification(false);
  };

  const { logout } = useAuth();

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      try {
        await logout();
        // The logout function will handle the redirection
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback redirection in case of error
        window.location.href = '/signin';
      }
    }
  };

  return (
    <header className="flex-shrink-0 p-4 pr-8 flex items-center justify-between relative z-50">
      <div className="space-y-1">
        {title && <h1 className="text-2xl font-bold text-amber-700">{title}</h1>}
        {subtitle && <p className="text-sm text-amber-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-6">
        
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
            className={`relative p-2 rounded-full transition-all duration-300 ${isNotifOpen ? 'bg-white/10 text-white' : 'text-[#9ca3af] hover:text-white hover:bg-white/5'}`}
          >
            <NotificationIcon className="w-6 h-6" />
            {hasNewNotification && (
               <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F09819] opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F09819]"></span>
               </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-4 w-80 bg-[rgba(20,20,20,0.8)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl border border-white/10 shadow-2xl animate-fade-in-up overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-white">Notifications</h3>
                <button onClick={() => setHasNewNotification(false)} className="text-xs text-[#FF512F] hover:text-white transition-colors">Mark all read</button>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => notif.tab && setActiveTab && setActiveTab(notif.tab)}
                    className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.type === 'alert' ? 'bg-[#FF3D00]' : notif.type === 'order' ? 'bg-[#4CAF50]' : 'bg-[#FF512F]'}`}></div>
                      <div>
                        <p className="text-sm text-white font-medium leading-tight group-hover:text-[#F09819] transition-colors">{notif.text}</p>
                        <p className="text-xs text-[#9ca3af] mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border-t border-white/10">
                <span className="text-xs font-bold text-neutral">View All History</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
            className={`flex items-center gap-3 p-1.5 rounded-full border border-transparent transition-all duration-300 ${isProfileOpen ? 'bg-white/10 border-white/10' : 'hover:bg-white/5'}`}
          >
            <img src="https://picsum.photos/id/237/200/200" alt="Admin Avatar" className="w-9 h-9 rounded-full border-2 border-[#FF512F] object-cover" />
            <div className="pr-2 hidden md:block text-left">
              <p className="font-bold text-sm text-white leading-none">Admin</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5 font-medium">Superuser</p>
            </div>
             <ChevronDownIcon className={`w-4 h-4 text-[#9ca3af] transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''} hidden md:block`}/>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-4 w-48 bg-[rgba(20,20,20,0.8)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl border border-white/10 shadow-2xl animate-fade-in-up overflow-hidden">
              <div className="py-2">
                <button onClick={() => { setActiveTab?.('Settings'); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2.5 text-sm text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Help & Support
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-[#FF3D00] hover:bg-[#FF3D00]/10 transition-colors flex items-center gap-2 font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
