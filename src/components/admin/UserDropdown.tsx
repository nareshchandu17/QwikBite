'use client';

import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function UserDropdown() {
  const router = useRouter();

  const handleLogout = async () => {
    // Immediately redirect while signOut processes in background
    router.push('/');
    await signOut({ redirect: false });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-amber-100"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-300">
            <span className="text-amber-700 font-medium">AD</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 mt-2 mr-2 bg-gray-900 border border-gray-700 shadow-xl" align="end">
        <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
          <User className="mr-2 h-4 w-4 text-gray-300" />
          <span className="text-gray-300">Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-gray-800 text-red-400"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
