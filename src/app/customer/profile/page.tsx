'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  LogOut, 
  User, 
  Mail, 
  Phone, 
  Hash, 
  Shield, 
  Settings, 
  ShoppingBag, 
  TrendingUp, 
  Star, 
  ChevronRight, 
  Loader2, 
  Edit3,
  Camera,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerGuard } from '@/hooks/use-customer-guard';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email' }),
  regNo: z.string().optional(),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { isAuthenticated, loading: authLoading } = useCustomerGuard();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prevMode => !prevMode);
  }, []);

  const [orderStats] = useState({
    totalOrders: 12,
    avgOrderTime: '2.5 mins faster',
    favoriteMeal: 'Paneer Tikka Masala',
    rewardPoints: 450,
    savingsThisMonth: '₹120'
  } as const);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      regNo: '',
      phone: ''
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/customer/profile', { 
          credentials: 'include' 
        });
        const data = await response.json();
        
        if (data.success && data.user) {
          reset({
            name: data.user.name || '',
            email: data.user.email || '',
            regNo: data.user.regNo || '',
            phone: data.user.phone || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to auth context data if API fails
        if (user) {
          reset({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || ''
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [reset, isAuthenticated, authLoading, user]);

  const handleSignOut = useCallback(() => {
    toast.promise(new Promise((resolve) => {
      logout();
      setTimeout(resolve, 800);
    }), {
      loading: 'Signing out...',
      success: 'Signed out successfully!',
      error: 'Error signing out',
    });
  }, [logout]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Profile updated successfully');
        setIsEditMode(false);
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f6f5] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#f96124] mb-4" />
          <p className="text-[#9e6047] font-medium animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    router.push('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f6f5] text-[#1c110d] font-sans pb-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-[#1c110d]">Account Settings</h1>
          <p className="text-[#9e6047] mt-2 text-lg">Manage your profile, preferences, and security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e9d5ce] flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#f96124] to-[#ff8e53] opacity-10" />
              
              <div className="relative mb-6 mt-4">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#f96124] to-[#ff8e53] p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-[#f96124]">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-[#e9d5ce] text-[#f96124] hover:scale-110 transition-transform">
                  <Camera size={18} />
                </button>
              </div>

              <h3 className="text-2xl font-black">{user.name}</h3>
              <p className="text-[#9e6047] font-medium mb-6">{user.email}</p>
              
              <div className="w-full pt-6 border-t border-[#f8f6f5] grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-2xl bg-[#fcf9f8]">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#9e6047] mb-1">Status</p>
                  <p className="text-sm font-bold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle2 size={14} /> Active
                  </p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-[#fcf9f8]">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#9e6047] mb-1">Points</p>
                  <p className="text-sm font-bold text-[#f96124]">{orderStats.rewardPoints}</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-[#e9d5ce] flex flex-col items-center justify-center text-center"
              >
                <div className="p-3 rounded-2xl bg-orange-50 text-[#f96124] mb-3">
                  <ShoppingBag size={24} />
                </div>
                <p className="text-2xl font-black">{orderStats.totalOrders}</p>
                <p className="text-xs font-bold text-[#9e6047] uppercase tracking-tighter">Orders</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-[#e9d5ce] flex flex-col items-center justify-center text-center"
              >
                <div className="p-3 rounded-2xl bg-green-50 text-green-600 mb-3">
                  <TrendingUp size={24} />
                </div>
                <p className="text-2xl font-black">{orderStats.savingsThisMonth}</p>
                <p className="text-xs font-bold text-[#9e6047] uppercase tracking-tighter">Saved</p>
              </motion.div>
            </div>
          </div>

          {/* Main Form Content */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e9d5ce] overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-[#f8f6f5] flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f96124]/10 rounded-xl text-[#f96124]">
                    <User size={20} />
                  </div>
                  <h2 className="text-xl font-black">Personal Information</h2>
                </div>
                <button
                  onClick={toggleEditMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isEditMode 
                    ? "bg-[#f8f6f5] text-[#9e6047] hover:bg-[#e9d5ce]" 
                    : "bg-[#f96124]/10 text-[#f96124] hover:bg-[#f96124]/20"
                  }`}
                >
                  {isEditMode ? <X size={16} /> : <Edit3 size={16} />}
                  {isEditMode ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="p-8">
                <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#1c110d] uppercase tracking-widest flex items-center gap-2">
                        <User size={14} className="text-[#f96124]" /> Full Name
                      </label>
                      <input
                        {...register("name")}
                        disabled={!isEditMode}
                        placeholder="Your Name"
                        className={`w-full px-5 py-4 rounded-2xl border transition-all text-lg font-medium outline-none ${
                          isEditMode 
                          ? "border-[#f96124] ring-4 ring-[#f96124]/5 bg-white" 
                          : "border-transparent bg-[#f8f6f5] opacity-80"
                        }`}
                      />
                      {errors.name && <p className="text-xs text-red-500 font-bold ml-2">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#1c110d] uppercase tracking-widest flex items-center gap-2">
                        <Mail size={14} className="text-[#f96124]" /> Email Address
                      </label>
                      <input
                        {...register("email")}
                        disabled={true}
                        placeholder="email@university.edu"
                        className="w-full px-5 py-4 rounded-2xl border-transparent bg-[#f8f6f5] opacity-60 text-lg font-medium cursor-not-allowed"
                      />
                      <p className="text-[10px] text-[#9e6047] italic ml-2">Email cannot be changed for security</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#1c110d] uppercase tracking-widest flex items-center gap-2">
                        <Phone size={14} className="text-[#f96124]" /> Phone Number
                      </label>
                      <input
                        {...register("phone")}
                        disabled={!isEditMode}
                        placeholder="+91 98765 43210"
                        className={`w-full px-5 py-4 rounded-2xl border transition-all text-lg font-medium outline-none ${
                          isEditMode 
                          ? "border-[#f96124] ring-4 ring-[#f96124]/5 bg-white" 
                          : "border-transparent bg-[#f8f6f5] opacity-80"
                        }`}
                      />
                      {errors.phone && <p className="text-xs text-red-500 font-bold ml-2">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#1c110d] uppercase tracking-widest flex items-center gap-2">
                        <Hash size={14} className="text-[#f96124]" /> Student Registration ID
                      </label>
                      <input
                        {...register("regNo")}
                        disabled={!isEditMode}
                        placeholder="REG-2024-XXXX"
                        className={`w-full px-5 py-4 rounded-2xl border transition-all text-lg font-medium outline-none ${
                          isEditMode 
                          ? "border-[#f96124] ring-4 ring-[#f96124]/5 bg-white" 
                          : "border-transparent bg-[#f8f6f5] opacity-80"
                        }`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditMode && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-end pt-4"
                      >
                        <button
                          type="submit"
                          disabled={!isDirty || isSaving}
                          className="px-10 py-4 bg-gradient-to-r from-[#f96124] to-[#ff8e53] text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                        >
                          {isSaving && <Loader2 size={18} className="animate-spin" />}
                          Save Changes
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </motion.div>

            {/* Other Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-8 border border-[#e9d5ce] shadow-sm group hover:border-[#f96124] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Shield size={24} />
                  </div>
                  <ChevronRight className="text-[#e9d5ce] group-hover:text-[#f96124] group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xl font-black mb-2">Privacy & Security</h4>
                <p className="text-sm text-[#9e6047]">Manage your password, 2FA, and connected apps.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl p-8 border border-[#e9d5ce] shadow-sm group hover:border-[#f96124] transition-colors cursor-pointer"
                onClick={handleSignOut}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                    <LogOut size={24} />
                  </div>
                  <ChevronRight className="text-[#e9d5ce] group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xl font-black mb-2">Sign Out</h4>
                <p className="text-sm text-[#9e6047]">Securely log out of your campus account.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}