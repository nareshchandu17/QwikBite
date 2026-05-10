'use client';

import { Bell, Check, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const notifications = [
  {
    id: 1,
    title: 'New order received',
    description: 'Table 5 has placed an order',
    time: '2 min ago',
    read: false,
    type: 'order'
  },
  {
    id: 2,
    title: 'New review',
    description: 'You have received a new 5-star review',
    time: '1 hour ago',
    read: true,
    type: 'review'
  },
  {
    id: 3,
    title: 'Low inventory',
    description: 'Chocolate cake is running low',
    time: '3 hours ago',
    read: false,
    type: 'alert'
  }
];

export default function NotificationsDropdown() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-amber-100"
        >
          <Bell className="h-5 w-5 text-amber-800" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0 mt-2 mr-2 bg-gray-900 border border-gray-700 shadow-xl" align="end">
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="font-semibold text-white">Notifications</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-[#FF512F] [&::-webkit-scrollbar-thumb]:to-[#F09819] [&::-webkit-scrollbar-thumb]:rounded-full">
          {notifications.map((notification) => (
            <DropdownMenuItem 
              key={notification.id} 
              className={`flex items-start gap-3 p-3 border-b border-gray-800 ${!notification.read ? 'bg-gray-800' : 'bg-transparent'} hover:bg-gray-700 transition-colors`}
            >
              <div className={`p-2 rounded-full ${
                notification.type === 'alert' ? 'bg-red-900/30 text-red-400' : 
                notification.type === 'order' ? 'bg-blue-900/30 text-blue-400' : 'bg-yellow-900/30 text-yellow-400'
              }`}>
                {notification.type === 'order' && <Clock className="h-4 w-4" />}
                {notification.type === 'review' && <Check className="h-4 w-4" />}
                {notification.type === 'alert' && <AlertCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{notification.title}</p>
                <p className="text-sm text-gray-300 mt-0.5">{notification.description}</p>
                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-[#FF512F] mt-1"></div>
              )}
            </DropdownMenuItem>
          ))}
        </div>
        <div className="p-3 border-t border-gray-700 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#FF512F] hover:bg-gray-800 hover:text-white transition-colors font-medium"
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
