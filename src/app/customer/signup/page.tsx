'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState({
    name: true,
    regNo: true,
    email: true,
    password: true
  });

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize field validation
  const validateField = useCallback((name: string, value: string) => {
    if (name === 'name') {
      return value === '' || value.length >= 1;
    }
    if (name === 'regNo') {
      const regNoRegex = /^[a-zA-Z0-9]+$/;
      return value === '' || regNoRegex.test(value);
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return value === '' || emailRegex.test(value);
    }
    if (name === 'password') {
      return value === '' || value.length >= 6;
    }
    return true;
  }, []);

  const handleChange = useCallback((field: string, value: string) => {
    // Update the specific field
    if (field === 'name') setName(value);
    if (field === 'regNo') setRegNo(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    // Real-time validation
    setIsValid(prev => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  }, [validateField]);

  const validateForm = useCallback(() => {
    const nameValid = name !== '' && validateField('name', name);
    const regNoValid = regNo !== '' && validateField('regNo', regNo);
    const emailValid = email !== '' && validateField('email', email);
    const passwordValid = password !== '' && validateField('password', password);

    setIsValid({
      name: nameValid,
      regNo: regNoValid,
      email: emailValid,
      password: passwordValid
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
  }, [name, regNo, email, password, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('Sending signup request with:', { name, regNo, email, role });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          name: name.trim(),
          regNo: regNo.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          role: (role || 'customer').toLowerCase()
        }),
      });

      // First, check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response. Please try again.');
      }

      const data = await response.json();
      console.log('Signup response:', { status: response.status, data });

      if (!response.ok) {
        // Handle specific error cases
        let errorMessage = data?.error || 'Signup failed. Please try again.';

        if (errorMessage.includes('already exists')) {
          errorMessage = 'An account with this email or registration number already exists.';
        } else if (response.status === 400) {
          errorMessage = data?.error || 'Invalid input. Please check your details and try again.';
        } else if (response.status >= 500) {
          errorMessage = 'A server error occurred. Please try again later.';
        }

        toast.error(errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Show success message and redirect to login
      setSuccess(true);
      toast.success('Account created successfully! Redirecting to sign in...');

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/signin');
      }, 1500);
    } catch (err: unknown) {
      console.error('Signup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during signup';
      setError(errorMessage);
      // Error toast is already shown in the !response.ok block
      if (!errorMessage.includes('already exists')) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [name, regNo, email, password, role, router, validateForm]);

  // Memoize role selection buttons
  const roleSelection = useMemo(() => (
    <motion.div
      className="grid grid-cols-2 gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      <motion.button
        type="button"
        onClick={() => setRole('customer')}
        className={`flex items-center justify-center p-3 rounded-lg border transition-all ${role === 'customer'
          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
          : 'border-amber-200 hover:border-amber-300'
          }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <User className="h-5 w-5 text-amber-600 mr-2" />
        <span className="font-medium text-gray-700">Customer</span>
      </motion.button>
      <motion.button
        type="button"
        onClick={() => setRole('admin')}
        className={`flex items-center justify-center p-3 rounded-lg border transition-all ${role === 'admin'
          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
          : 'border-amber-200 hover:border-amber-300'
          }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Shield className="h-5 w-5 text-orange-600 mr-2" />
        <span className="font-medium text-gray-700">Admin</span>
      </motion.button>
    </motion.div>
  ), [role]);

  // Memoize form elements
  const formElements = useMemo(() => (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <motion.input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`appearance-none relative block w-full px-4 py-3 border rounded-lg sm:text-sm transition-all ${!isValid.name && name !== ''
            ? 'border-red-300 focus:ring-red-500'
            : 'border-amber-300 placeholder-gray-500 text-gray-900 focus:ring-amber-500 focus:border-amber-500'
            }`}
          placeholder="Enter your full name"
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        {!isValid.name && name !== '' && (
          <p className="mt-1 text-xs text-red-500">Please enter your full name</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <label htmlFor="regNo" className="block text-sm font-medium text-gray-700 mb-1">
          Registration Number
        </label>
        <motion.input
          id="regNo"
          name="regNo"
          type="text"
          required
          value={regNo}
          onChange={(e) => handleChange('regNo', e.target.value)}
          className={`appearance-none relative block w-full px-4 py-3 border rounded-lg sm:text-sm transition-all ${!isValid.regNo && regNo !== ''
            ? 'border-red-300 focus:ring-red-500'
            : 'border-amber-300 placeholder-gray-500 text-gray-900 focus:ring-amber-500 focus:border-amber-500'
            }`}
          placeholder="Enter your registration number"
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        {!isValid.regNo && regNo !== '' && (
          <p className="mt-1 text-xs text-red-500">Registration number should contain only letters and numbers</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <motion.input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`appearance-none relative block w-full px-4 py-3 border rounded-lg sm:text-sm transition-all ${!isValid.email && email !== ''
            ? 'border-red-300 focus:ring-red-500'
            : 'border-amber-300 placeholder-gray-500 text-gray-900 focus:ring-amber-500 focus:border-amber-500'
            }`}
          placeholder="your.email@university.edu"
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        {!isValid.email && email !== '' && (
          <p className="mt-1 text-xs text-red-500">Please enter a valid email address</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <motion.input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={`appearance-none relative block w-full px-4 py-3 pr-12 border rounded-lg sm:text-sm transition-all ${!isValid.password && password !== ''
              ? 'border-red-300 focus:ring-red-500'
              : 'border-amber-300 placeholder-gray-500 text-gray-900 focus:ring-amber-500 focus:border-amber-500'
              }`}
            placeholder="Create a strong password"
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-amber-600" />
            ) : (
              <Eye className="h-5 w-5 text-amber-600" />
            )}
          </motion.button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 6 characters
        </p>
        {!isValid.password && password !== '' && (
          <p className="mt-1 text-xs text-red-500">Password must be at least 6 characters</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        {roleSelection}
      </motion.div>
    </div>
  ), [name, regNo, email, password, showPassword, isValid, handleChange, roleSelection]);

  // Prevent hydration mismatch by not rendering form until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-amber-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-amber-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8 border border-amber-100"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div
            className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <User className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h2
            className="mt-2 text-3xl font-extrabold text-gray-900"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            Create your account
          </motion.h2>
          <motion.p
            className="mt-2 text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            Join our canteen community today
          </motion.p>
        </motion.div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div
              className="rounded-md bg-red-50 p-4 border border-red-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-sm text-red-700">{error}</div>
            </motion.div>
          )}

          {success && (
            <motion.div
              className="rounded-md bg-green-50 p-4 border border-green-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-sm text-green-700">
                Account created successfully! Redirecting to sign in...
              </div>
            </motion.div>
          )}

          {formElements}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <motion.button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <motion.button
              onClick={() => router.push('/signin')}
              className="font-medium text-amber-600 hover:text-amber-500 cursor-pointer transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign in
            </motion.button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}