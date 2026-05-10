"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, User, Lock, Mail, Key, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from '@/context/AuthModalContext';
import { cn } from "@/lib/utils";

type SignInCardProps = {
  onSuccess?: (() => void) | ((redirectUrl?: string) => void);
  onSwitchToSignUp?: () => void;
  redirectOnSuccess?: boolean | string;
  defaultRedirect?: string;
  className?: string;
};

export function SignInCard({
  onSuccess,
  onSwitchToSignUp,
  redirectOnSuccess = true,
  defaultRedirect,
  className,
}: SignInCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update: updateSession } = useSession();
  const { closeModal, openModal } = useAuthModal();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState({ email: true, password: true });

  const callbackUrl = useMemo(
    () => defaultRedirect || searchParams?.get("callbackUrl") || "/",
    [defaultRedirect, searchParams]
  );

  const validateField = (name: string, value: string) => {
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return value === "" || emailRegex.test(value);
    }
    if (name === "password") {
      return value === "" || value.length >= 6;
    }
    return true;
  };

  const validateForm = () => {
    const emailValid = form.email !== "" && validateField("email", form.email);
    const passwordValid = form.password !== "" && validateField("password", form.password);

    setIsValid({
      email: emailValid,
      password: passwordValid,
    });

    if (form.email === "") {
      toast.error("Please enter your email.", {
        duration: 3000,
        style: {
          background: 'rgba(239, 68, 68, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        },
      });
      return false;
    }

    if (!emailValid) {
      toast.error("Please enter a valid email address.", {
        duration: 3000,
        style: {
          background: 'rgba(239, 68, 68, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        },
      });
      return false;
    }

    if (form.password === "") {
      toast.error("Please enter your password.", {
        duration: 3000,
        style: {
          background: 'rgba(239, 68, 68, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        },
      });
      return false;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.", {
        duration: 3000,
        style: {
          background: 'rgba(239, 68, 68, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        },
      });
      return false;
    }

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setIsValid((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Sign in with credentials
      console.log("🔐 Step 1: Calling signIn()...");
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      console.log("🔐 Step 2: signIn result:", result);

      if (!result?.ok) {
        const errorMessage = result?.error || "Failed to sign in";
        
        // Handle specific error cases
        if (errorMessage.includes("Invalid email or password")) {
          toast.error("Invalid email or password. Please check your credentials and try again.", {
            duration: 3000,
            style: {
              background: 'rgba(239, 68, 68, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            },
          });
        } else if (errorMessage.includes("No account found") || errorMessage.includes("user not found")) {
          toast.error("No account found with this email. Please sign up first.", {
            duration: 3000,
            style: {
              background: 'rgba(239, 68, 68, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            },
          });
        } else if (errorMessage.includes("verify") || errorMessage.includes("verified")) {
          toast.error("Please verify your account before signing in.", {
            duration: 3000,
            style: {
              background: 'rgba(239, 68, 68, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            },
          });
        } else {
          toast.error("Something went wrong. Please try again later.", {
            duration: 3000,
            style: {
              background: 'rgba(239, 68, 68, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            },
          });
        }
        
        setError(errorMessage);
        return;
      }

      // Step 2: Update session to get fresh role info
      console.log("🔐 Step 3: Calling updateSession()...");
      const updatedSession = await updateSession();
      
      console.log("🔐 Step 4: Updated session:", updatedSession);
      console.log("🔐 Step 4: User role:", updatedSession?.user?.role);
      
      toast.success("Welcome back! Redirecting...", {
        duration: 2000,
        style: {
          background: 'rgba(34, 197, 94, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        },
      });
      
      // Step 3: Immediate redirect to be as fast as possible
      // We use window.location.href for a full page navigation which ensures 
      // the middleware runs correctly and redirects to the appropriate dashboard
      // based on the newly set session cookie. This is often faster and more reliable
      // than waiting for client-side state synchronization.
      
      // Determine redirect path
      let redirectPath = '/';
      const userRole = updatedSession?.user?.role;

      if (typeof redirectOnSuccess === 'string') {
        redirectPath = redirectOnSuccess;
      } else if (callbackUrl && callbackUrl !== '/' && !callbackUrl.includes('signin')) {
        redirectPath = callbackUrl;
      } else if (defaultRedirect && defaultRedirect !== '/') {
        redirectPath = defaultRedirect;
      } else {
        // Role-based default
        if (userRole === 'admin' || userRole === 'canteen_staff') {
          redirectPath = '/admin/dashboard';
        } else {
          redirectPath = '/customer';
        }
      }
      
      onSuccess?.();
      window.location.href = redirectPath;
    } catch (err) {
      toast.error("Something went wrong. Please try again later.", {
        duration: 3000,
        style: {
          background: 'rgba(239, 68, 68, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        },
      });
      
      const message = err instanceof Error ? err.message : "Failed to sign in";
      setError(message);
      console.error("🔴 Sign in error:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  
  const handleClose = () => {
    if (onSuccess) {
      onSuccess();
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
        onClick={handleClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
        aria-label="Close sign in form"
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
          <User className="h-8 w-8 text-orange-500" />
        </div>
        <h2 className="text-3xl font-bold mb-2 tracking-tight text-[#111827]">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">qwikBite</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Hungry? Skip the line, not the class.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-4 space-y-6">
        <div className="relative group">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className={cn(
              "floating-input peer w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl",
              "focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm",
              !isValid.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"
            )}
            placeholder=" "
            disabled={loading}
          />
          <span className="absolute left-3.5 top-3.5 text-gray-400 peer-focus:text-orange-500 transition-colors">
            <Mail className="h-5 w-5" />
          </span>
          <label 
            className={cn(
              "floating-label absolute left-11 top-3.5 text-gray-500 dark:text-gray-400 text-sm",
              "transition-all pointer-events-none bg-white dark:bg-gray-900 px-1",
              "peer-focus:text-orange-500 peer-placeholder-shown:bg-transparent"
            )}
            htmlFor="email"
          >
            Student Email
          </label>
          {!isValid.email && (
            <p className="mt-1 text-xs text-red-500">Please enter a valid email</p>
          )}
        </div>

        <div className="relative group">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            className={cn(
              "floating-input peer w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl",
              "focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm",
              !isValid.password ? "border-red-500" : "border-gray-200 dark:border-gray-700"
            )}
            placeholder=" "
            disabled={loading}
          />
          <span className="absolute left-3.5 top-3.5 text-gray-400 peer-focus:text-orange-500 transition-colors">
            <Lock className="h-5 w-5" />
          </span>
          <label 
            className={cn(
              "floating-label absolute left-11 top-3.5 text-gray-500 dark:text-gray-400 text-sm",
              "transition-all pointer-events-none bg-white dark:bg-gray-900 px-1",
              "peer-focus:text-orange-500 peer-placeholder-shown:bg-transparent"
            )}
            htmlFor="password"
          >
            Password
          </label>
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
          {!isValid.password && (
            <p className="mt-1 text-xs text-red-500">Password is required</p>
          )}
        </div>

        <div className="flex space-x-1 h-1 w-full mt-1">
          <div className={cn(
            "h-full rounded-full transition-all duration-300",
            form.password.length > 0 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
          )} style={{ width: form.password.length > 0 ? '25%' : '0%' }}></div>
          <div className={cn(
            "h-full rounded-full transition-all duration-300",
            form.password.length > 3 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
          )} style={{ width: form.password.length > 3 ? '25%' : '0%' }}></div>
          <div className={cn(
            "h-full rounded-full transition-all duration-300",
            form.password.length > 6 ? "bg-yellow-400" : "bg-gray-200 dark:bg-gray-700"
          )} style={{ width: form.password.length > 6 ? '25%' : '0%' }}></div>
          <div className={cn(
            "h-full rounded-full transition-all duration-300",
            form.password.length > 8 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
          )} style={{ width: form.password.length > 8 ? '25%' : '0%' }}></div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="form-checkbox h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-600 transition duration-150 ease-in-out" 
            />
            <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors select-none">
              Remember me
            </span>
          </label>
          <button
            type="button"
            className="flex items-center text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors cursor-pointer"
            onClick={() => {
              closeModal();
              setTimeout(() => {
                openModal('forgotpassword');
              }, 100);
            }}
          >
            <Key className="h-4 w-4 mr-1" />
            Forgot Password?
          </button>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full relative group overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600",
            "hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl",
            "shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300",
            "transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
            loading ? "opacity-70 cursor-not-allowed" : ""
          )}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12"></div>
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Getting your food ready...
              </>
            ) : (
              <>
                Get My Food Ready 🍽️
              </>
            )}
          </span>
        </motion.button>
      </form>

      <div className="bg-gray-50 dark:bg-gray-800/50 py-5 px-8 border-t border-gray-100 dark:border-gray-700 mt-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            {onSwitchToSignUp ? (
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-orange-500 font-semibold hover:underline"
              >
                Sign up now
              </button>
            ) : (
              <button 
                onClick={() => {
                  window.location.href = '/auth/signup';
                }}
                className="text-orange-500 font-semibold hover:underline"
              >
                Sign up now
              </button>
            )}
          </p>
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 gap-1">
              <Lock className="h-3 w-3" />
              Secure Connection
            </div>
            <button 
              className="flex items-center text-xs text-gray-400 dark:text-gray-500 gap-1 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
              onClick={() => toast.info("Contact support for assistance")}
            >
              <HelpCircle className="h-3 w-3" />
              Need Help?
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


