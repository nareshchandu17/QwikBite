'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, Badge, Pin, Check, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SignUpCardProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
  className?: string;
}

type ValidationState = {
  name: boolean;
  regNo: boolean;
  email: boolean;
  password: boolean;
};

type Role = 'customer' | 'admin';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regNoRegex = /^[a-zA-Z0-9]+$/;

export function SignUpCard({ onSuccess, onSwitchToSignIn, className }: SignUpCardProps) {
  const { update: updateSession } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    regNo: '',
    email: '',
    password: '',
    role: 'customer' as Role,
  });
  const [isValid, setIsValid] = useState<ValidationState>({
    name: true,
    regNo: true,
    email: true,
    password: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateField = (name: keyof ValidationState, value: string) => {
    switch (name) {
      case 'name':
        return value.trim().length > 0;
      case 'regNo':
        return value === '' || regNoRegex.test(value);
      case 'email':
        return value === '' || emailRegex.test(value);
      case 'password':
        return value === '' || value.length >= 6;
      default:
        return true;
    }
  };

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in isValid) {
      setIsValid((prev) => ({
        ...prev,
        [key]: validateField(key as keyof ValidationState, value),
      }));
    }
  };

  const validateForm = () => {
    const nameValid = form.name.trim().length > 0;
    const regNoValid = form.regNo.trim().length > 0 && regNoRegex.test(form.regNo);
    const emailValid = emailRegex.test(form.email);
    const passwordValid = form.password.length >= 6;

    setIsValid({
      name: nameValid,
      regNo: regNoValid,
      email: emailValid,
      password: passwordValid,
    });

    if (!nameValid || !regNoValid || !emailValid || !passwordValid) {
      if (!nameValid && !regNoValid && !emailValid && !passwordValid) {
        toast.error('Please fill in all required fields.');
      } else if (!nameValid) {
        toast.error('Please enter your full name.');
      } else if (!regNoValid) {
        toast.error('Registration number should contain only letters and numbers.');
      } else if (!emailValid) {
        toast.error('Please enter a valid email address.');
      } else if (!passwordValid) {
        toast.error('Password must be at least 6 characters.');
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(form),
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Signup API returned non-JSON response:', text);
        throw new Error('Server returned an unexpected response format. Please try again.');
      }

      if (!response.ok) {
        const message = data?.error || 'Signup failed. Please try again.';
        if (message.includes('already exists')) {
          toast.error('An account with this email or registration number already exists.');
        } else {
          toast.error(message);
        }
        setError(message);
        return;
      }

      toast.success('Account created successfully! Signing you in...');

      const signInResult = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!signInResult?.ok) {
        const message =
          signInResult?.error || 'Account created, but automatic sign in failed. Please log in manually.';
        setError(message);
        toast.error(message);
        return;
      }

      // Step 2: Update session to get fresh role info
      const updatedSession = await updateSession();
      
      toast.success('Signed in successfully! Redirecting...');

      // Determine redirect path
      let redirectPath = '/';
      const userRole = updatedSession?.user?.role || form.role;

      if (userRole === 'admin' || userRole === 'canteen_staff') {
        redirectPath = '/admin/dashboard';
      } else {
        redirectPath = '/customer';
      }
      
      // Step 3: Fast and smooth transition
      // We trigger the navigation FIRST so the browser starts loading the new page
      window.location.href = redirectPath;
      
      // We delay closing the modal slightly so it covers the "/" screen flash 
      // while the new page is being prepared by the browser
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // Check for Caps Lock
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Caps Lock using different methods
      const capsLockOn = e.getModifierState ? e.getModifierState('CapsLock') : 
        (e.shiftKey && (e.key >= 'a' && e.key <= 'z')) || 
        (e.key >= 'A' && e.key <= 'Z' && !e.shiftKey);
      
      setCapsLockOn(capsLockOn);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const capsLockOn = e.getModifierState ? e.getModifierState('CapsLock') : false;
      setCapsLockOn(capsLockOn);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);  return (
    <motion.div
      className={cn(
        'relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={onSuccess}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
        aria-label="Close sign up form"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-400/20 rounded-full blur-[120px] dark:bg-orange-600/20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] dark:bg-blue-600/10"></div>
      </div>
      
      {/* Header */}
      <div className="pt-8 px-8 pb-2 text-center shrink-0">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-3 shadow-sm ring-4 ring-orange-50 dark:ring-orange-900/20">
          <Utensils className="h-6 w-6 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold mb-1 tracking-tight text-gray-900 dark:text-white">
          Join Your Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Food Network</span> 🍽️
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Order faster. Skip queues. Eat smarter.
        </p>
      </div>

      {error && (
        <motion.p
          className="text-red-500 mb-4 text-center px-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}

      {/* Main Form Area */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        {/* Scrollable Content Container */}
        <div className="px-8 py-3 overflow-y-auto max-h-[70vh] custom-scrollbar flex-1">
          <div className="space-y-5">
            
            {/* 1. Personal Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal Details</span>
                <div className="h-px bg-gray-100 dark:bg-gray-700 flex-grow"></div>
              </div>
              
              <div className="relative">
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={cn(
                      "glow-input w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border rounded-xl",
                      "focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm placeholder-gray-400",
                      !isValid.name && form.name !== '' ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    )}
                    placeholder="John Doe"
                    disabled={loading}
                  />
                  <span className="absolute left-2.5 top-2 text-gray-400">
                    <User className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="relative">
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5" htmlFor="regNo">
                  Registration Number
                </label>
                <div className="relative">
                  <input
                    id="regNo"
                    name="regNo"
                    type="text"
                    value={form.regNo}
                    onChange={(e) => handleChange('regNo', e.target.value)}
                    className={cn(
                      "glow-input w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border rounded-xl",
                      "focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm placeholder-gray-400",
                      !isValid.regNo && form.regNo !== '' ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    )}
                    placeholder="e.g. 21CSE045"
                    disabled={loading}
                  />
                  <span className="absolute left-2.5 top-2 text-gray-400">
                    <Pin className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Select Role Section */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Role</span>
                <div className="h-px bg-gray-100 dark:bg-gray-700 flex-grow"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5">
                <label className="cursor-pointer group relative">
                  <input 
                    type="radio" 
                    name="role" 
                    value="customer" 
                    checked={form.role === 'customer'}
                    onChange={() => handleChange('role', 'customer')}
                    className="peer sr-only" 
                  />
                  <div className="p-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-900 peer-checked:border-orange-500 peer-checked:bg-orange-50 dark:peer-checked:bg-orange-900/10 transition-all duration-200 h-full flex flex-col items-center justify-center text-center gap-1.5">
                    <User className="h-4 w-4 text-gray-400 peer-checked:text-orange-500 transition-colors" />
                    <div>
                      <div className="font-semibold text-xs text-gray-700 dark:text-gray-200">Customer</div>
                      <div className="text-[9px] text-gray-500">Order Food</div>
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 opacity-0 peer-checked:opacity-100 transition-opacity text-orange-500">
                    <Check className="h-3 w-3" />
                  </div>
                </label>

                <label className="cursor-pointer group relative">
                  <input 
                    type="radio" 
                    name="role" 
                    value="admin" 
                    checked={form.role === 'admin'}
                    onChange={() => handleChange('role', 'admin')}
                    className="peer sr-only" 
                  />
                  <div className="p-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-900 peer-checked:border-orange-500 peer-checked:bg-orange-50 dark:peer-checked:bg-orange-900/10 transition-all duration-200 h-full flex flex-col items-center justify-center text-center gap-1.5">
                    <Badge className="h-4 w-4 text-gray-400 peer-checked:text-orange-500 transition-colors" />
                    <div>
                      <div className="font-semibold text-xs text-gray-700 dark:text-gray-200">Admin</div>
                      <div className="text-[9px] text-gray-500">Manage Canteen</div>
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 opacity-0 peer-checked:opacity-100 transition-opacity text-orange-500">
                    <Check className="h-3 w-3" />
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Access Credentials */}
            <div className="space-y-3 pt-1 pb-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Access Credentials</span>
                <div className="h-px bg-gray-100 dark:bg-gray-700 flex-grow"></div>
              </div>

              <div className="relative">
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5" htmlFor="email">
                  College Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={cn(
                      "glow-input w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-800 border rounded-xl",
                      "focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm placeholder-gray-400",
                      !isValid.email && form.email !== '' ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    )}
                    placeholder="you@university.edu"
                    disabled={loading}
                  />
                  <span className="absolute left-2.5 top-2 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-0.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={cn(
                      "glow-input w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-800 border rounded-xl",
                      "focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm placeholder-gray-400",
                      !isValid.password && form.password !== '' ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    )}
                    placeholder="Create a strong password"
                    disabled={loading}
                  />
                  <span className="absolute left-2.5 top-2 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Area */}
        <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
          <motion.button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full relative group overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600",
              "hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl",
              "shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300",
              "transform hover:-translate-y-0.5 focus:outline-none",
              loading ? "opacity-70 cursor-not-allowed" : ""
            )}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12"></div>
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>Create my campus account 🚀</>
              )}
            </span>
          </motion.button>
        </div>
      </form>

      {/* Footer Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 py-3 px-8 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" />
            Used by 5,000+ students
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" />
            Campus verified
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-orange-500 font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
