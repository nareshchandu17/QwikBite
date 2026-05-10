"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle, Star, Sparkles, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthModal } from '@/context/AuthModalContext';

type PasswordResetSuccessCardProps = {
  onSuccess?: () => void;
  onBackToSignIn?: () => void;
  className?: string;
};

export function PasswordResetSuccessCard({
  onSuccess,
  onBackToSignIn,
  className,
}: PasswordResetSuccessCardProps) {
  const { closeModal, openModal } = useAuthModal();

  const handleBackToLogin = () => {
    closeModal();
    setTimeout(() => {
      openModal('signin');
    }, 100);
    onSuccess?.();
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
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-400/20 rounded-full blur-[120px] dark:bg-green-600/20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-400/10 rounded-full blur-[120px] dark:bg-yellow-600/10"></div>
      </div>

      <div className="pt-10 px-8 pb-4">
        {/* Icon Section with Stars/Confetti */}
        <div className="relative mb-8 flex justify-center">
          {/* Sparkle elements */}
          <motion.div
            className="absolute -top-4 -left-4 text-yellow-400 text-2xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Star className="w-6 h-6 fill-current" />
          </motion.div>
          <motion.div
            className="absolute top-2 -right-8 text-orange-400 text-xl"
            animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 15, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            <Sparkles className="w-5 h-5 fill-current" />
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -left-8 text-green-400 text-lg"
            animate={{ scale: [1, 1.2, 1], y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          >
            <Gift className="w-4 h-4 fill-current" />
          </motion.div>

          {/* Main Success Icon Container */}
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-green-500 to-amber-400 flex items-center justify-center shadow-success-glow"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
            style={{
              boxShadow: '0 0 40px rgba(34, 197, 94, 0.2)'
            }}
          >
            <CheckCircle className="w-14 h-14 text-white" />
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3 mb-10">
          <motion.h1
            className="text-3xl font-bold tracking-tight text-[#111827] dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            you&apos;re all set! 🎉
          </motion.h1>
          <motion.p
            className="text-gray-600 dark:text-gray-300 text-base leading-relaxed max-w-xs mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Your password has been successfully updated. You can now log in to your account.
          </motion.p>
        </div>

        {/* Primary Action */}
        <motion.div
          className="w-full flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button
            onClick={handleBackToLogin}
            className="w-full h-14 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white rounded-lg text-lg font-bold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Login 🚀
          </motion.button>

          <button
            onClick={() => toast.info("Contact support for assistance")}
            className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors pt-2"
          >
            Need help? Contact support
          </button>
        </motion.div>

        {/* Visual Context Element */}
        <motion.div
          className="mt-8 w-full h-2 rounded-full bg-orange-50 dark:bg-white/5 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="h-full w-full bg-gradient-to-r from-green-500 via-orange-500 to-amber-500 opacity-30"></div>
        </motion.div>
      </div>
    </motion.div>
  );
}
