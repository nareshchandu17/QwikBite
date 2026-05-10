"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, KeyRound, Rocket, Verified, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthModal } from '@/context/AuthModalContext';

type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

type SetNewPasswordCardProps = {
  token?: string;
  onSuccess?: () => void;
  onBackToSignIn?: () => void;
  className?: string;
};

export function SetNewPasswordCard({
  token,
  onSuccess,
  onBackToSignIn,
  className,
}: SetNewPasswordCardProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { closeModal, openModal } = useAuthModal();

  // Password validation checks
  const [validations, setValidations] = useState({
    length: false,
    number: false,
    specialChar: false,
    uppercase: false,
    lowercase: false,
  });

  const passwordStrength: PasswordStrength =
    Object.values(validations).filter(Boolean).length <= 2 ? 'weak' :
      Object.values(validations).filter(Boolean).length <= 3 ? 'medium' :
        Object.values(validations).filter(Boolean).length <= 4 ? 'strong' : 'very-strong';

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-blue-500',
    'very-strong': 'bg-green-500'
  };

  const strengthLabels = {
    weak: 'WEAK',
    medium: 'MEDIUM',
    strong: 'STRONG',
    'very-strong': 'VERY STRONG'
  };

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (Object.values(validations).filter(Boolean).length < 3) {
      toast.error('Password does not meet security requirements');
      return;
    }

    setLoading(true);

    try {
      // Call the reset password API with token
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token || '', // This would come from URL params
          password,
          confirmPassword
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }

      toast.success('Password reset successfully! Please sign in with your new password.');

      // Navigate to password reset success modal
      closeModal();
      setTimeout(() => {
        openModal('passwordresetsuccess');
      }, 100);

      onSuccess?.();
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const strengthBars = Array.from({ length: 4 }, (_, i) => {
    const strengthLevels = ['weak', 'medium', 'strong', 'very-strong'];
    const currentLevelIndex = strengthLevels.indexOf(passwordStrength);
    const isActive = i <= currentLevelIndex;

    return (
      <div
        key={i}
        className={cn(
          "h-full flex-1 transition-all duration-300",
          isActive ? strengthColors[passwordStrength] : "bg-gray-200 dark:bg-gray-700"
        )}
      />
    );
  });

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
        <h1 className="text-3xl font-bold mb-2 tracking-tight text-[#111827]">
          Create a Strong Password 🛡️
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          Keep your account secure with a unique password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-4 space-y-6">
        {/* New Password Input */}
        <div className="flex flex-col gap-2 group">
          <label className="text-[#111827] dark:text-gray-200 text-sm font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4" />
            New Password
          </label>
          <div className="relative flex items-stretch">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 rounded-lg bg-white dark:bg-gray-800 text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm h-14 px-4 text-base transition-all pr-12"
              placeholder="Enter your new password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Password Strength Meter */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[#111827] dark:text-gray-300 text-xs font-semibold uppercase tracking-wider">
              Password Strength
            </p>
            <p className={cn("text-xs font-bold", strengthColors[passwordStrength])}>
              {strengthLabels[passwordStrength]}
            </p>
          </div>
          <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-1">
            {strengthBars}
          </div>

          {/* Validation Checks */}
          <div className="mt-4 grid grid-cols-1 gap-2">
            <div className={cn("flex items-center gap-2 text-sm", validations.length ? "text-green-600 dark:text-green-400" : "text-gray-400")}>
              <CheckCircle className="w-4 h-4" />
              <span>At least 8 characters</span>
            </div>
            <div className={cn("flex items-center gap-2 text-sm", validations.number ? "text-green-600 dark:text-green-400" : "text-gray-400")}>
              <CheckCircle className="w-4 h-4" />
              <span>One number</span>
            </div>
            <div className={cn("flex items-center gap-2 text-sm", validations.specialChar ? "text-green-600 dark:text-green-400" : "text-gray-400")}>
              <CheckCircle className="w-4 h-4" />
              <span>One special character</span>
            </div>
            <div className={cn("flex items-center gap-2 text-sm", validations.uppercase ? "text-green-600 dark:text-green-400" : "text-gray-400")}>
              <CheckCircle className="w-4 h-4" />
              <span>One uppercase letter</span>
            </div>
            <div className={cn("flex items-center gap-2 text-sm", validations.lowercase ? "text-green-600 dark:text-green-400" : "text-gray-400")}>
              <CheckCircle className="w-4 h-4" />
              <span>One lowercase letter</span>
            </div>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[#111827] dark:text-gray-200 text-sm font-semibold flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Confirm New Password
          </label>
          <div className="relative flex items-stretch">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 rounded-lg bg-white dark:bg-gray-800 text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm h-14 px-4 text-base transition-all pr-12"
              placeholder="Re-type your password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-lg bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white font-bold text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-2"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Updating...</span>
            </>
          ) : (
            <>
              <span>Update My Password</span>
              <Rocket className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </motion.button>

        {/* Trust Footer */}
        <div className="pt-2 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium bg-orange-50 dark:bg-white/5 px-4 py-2 rounded-full">
            <Verified className="w-4 h-4" />
            <span>Your security is our top priority.</span>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
