"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Send, Mail, Key, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthModal } from '@/context/AuthModalContext';

type ForgotPasswordCardProps = {
  onSuccess?: () => void;
  onBackToSignIn?: () => void;
  className?: string;
};

export function ForgotPasswordCard({
  onSuccess,
  onBackToSignIn,
  className,
}: ForgotPasswordCardProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { closeModal, openModal } = useAuthModal();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your college email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset link');
      }

      toast.success('Reset link sent! Please check your email.');
      // Navigate to email confirmation modal
      closeModal();
      setTimeout(() => {
        openModal('emailconfirmation', undefined, { email });
      }, 100);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={cn(
        "relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden",
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={onBackToSignIn}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
        aria-label="Go back to sign in"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-400/20 rounded-full blur-[120px] dark:bg-orange-600/20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] dark:bg-blue-600/10"></div>
      </div>

      <div className="pt-10 px-8 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4 shadow-sm ring-4 ring-orange-50 dark:ring-orange-900/20">
          <Key className="h-8 w-8 text-orange-500" />
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight text-[#111827]">
          Reset your password
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
          No worries! It happens to the best of us. Let&apos;s get you back to your food.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-4 space-y-6">
        <div className="relative group">
          <div className={cn(
            "flex flex-col transition-all rounded-2xl bg-orange-50/30",
            "group-focus-within:bg-white group-focus-within:shadow-sm",
            isFocused && "bg-white shadow-sm"
          )}>
            <div className="relative flex items-center px-4 h-16">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="floating-label-input block w-full bg-transparent border-none text-[#111827] font-medium focus:outline-none focus:ring-0 peer h-full pt-4 placeholder:opacity-0"
                placeholder=" "
                disabled={loading}
              />
              <label
                className="absolute left-4 top-0 transition-all duration-200 pointer-events-none text-xs font-bold uppercase tracking-widest text-gray-500 peer-focus:text-orange-500 peer-placeholder-shown:translate-y-5 peer-placeholder-shown:scale-100 peer-focus:translate-y-1 peer-focus:scale-85"
                htmlFor="email"
              >
                College Email Address
              </label>
              <Mail className="text-orange-400/40 group-focus-within:text-orange-500 transition-colors ml-auto" />
            </div>
          </div>
        </div>

        <motion.button
          type="submit"

          disabled={loading}
          className={cn(
            "w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600",
            "hover:brightness-105 active:scale-[0.98] transition-all rounded-full",
            "text-white text-base font-bold flex items-center justify-center gap-2",
            "shadow-xl shadow-orange-200",
            loading ? "opacity-70 cursor-not-allowed" : ""
          )}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send Reset Link</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </motion.button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToSignIn}
            className="text-orange-500 hover:text-orange-700 text-sm font-bold transition-colors"
          >
            Try another way
          </button>
        </div>
      </form>

      <div className="my-6 flex items-center gap-4 px-8">
        <div className="h-[1px] flex-1 bg-orange-100"></div>
        <span className="text-orange-300 text-[10px] font-bold uppercase tracking-[0.2em]">Or</span>
        <div className="h-[1px] flex-1 bg-orange-100"></div>
      </div>

      <div className="px-8 pb-8 space-y-6">
        <button
          type="button"
          onClick={onBackToSignIn}
          className="w-full py-3.5 rounded-full border-2 border-orange-50 hover:bg-orange-50 hover:border-orange-100 text-gray-600 text-sm font-bold flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to login
        </button>

        <div className="flex items-center justify-center gap-2.5 px-6 py-3 bg-stone-50 rounded-2xl">
          <Shield className="text-orange-500/60 w-4 h-4" />
          <p className="text-[10px] font-bold text-stone-500 leading-tight text-center uppercase tracking-widest">
            Security first: We'll verify your identity before resetting.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
