"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Mail, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type EmailConfirmationCardProps = {
  email?: string;
  onSuccess?: () => void;
  onBackToSignIn?: () => void;
  onResend?: () => void;
  className?: string;
};

export function EmailConfirmationCard({
  email = "student@university.edu",
  onSuccess,
  onBackToSignIn,
  onResend,
  className,
}: EmailConfirmationCardProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (isResending) return;

    setIsResending(true);
    try {
      // Call the resend API
      await onResend?.();
      toast.success("Reset link resent successfully!");
    } catch (error) {
      toast.error("Failed to resend reset link");
    } finally {
      setIsResending(false);
    }
  };

  const handleOpenMailApp = () => {
    // Try to open the default mail app
    window.location.href = 'mailto:';
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
        {/* Central Illustration */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto rounded-full bg-orange-100/30 flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <Mail className="w-12 h-12 text-white" />
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-6 right-4 w-6 h-6 bg-yellow-400 rounded-full border-4 border-white dark:border-gray-900"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900"></div>
        </div>

        <h1 className="text-3xl font-bold mb-4 tracking-tight text-[#111827]">
          Check your inbox! 💌
        </h1>

        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-8">
          We've sent a password reset link to{" "}
          <span className="font-bold text-[#111827] dark:text-white">{email}</span>.
          It should arrive in a few minutes.
        </p>

        {/* Primary CTA Button */}
        <motion.button
          onClick={handleOpenMailApp}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-110 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-orange-200 transition-all transform hover:-translate-y-1 text-lg mb-6 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowUpRight className="w-5 h-5" />
          Open Mail App
        </motion.button>

        {/* Secondary Resend Link */}
        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          Didn&apos;t receive it?{" "}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-orange-500 hover:underline font-bold ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? "Sending..." : "Resend link"}
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-orange-50/50 dark:bg-gray-800/50 py-4 px-8 border-t border-orange-100 dark:border-gray-700 flex justify-center">
        <button
          onClick={onBackToSignIn}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to login
        </button>
      </div>
    </motion.div>
  );
}
