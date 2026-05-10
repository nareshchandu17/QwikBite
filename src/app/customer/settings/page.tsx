'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Bell, Lock, User, CreditCard, Clock, Globe, LogOut, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCustomerGuard } from '@/hooks/use-customer-guard'; // Updated import

export default function SettingsPage() {
  useCustomerGuard(); // Add this hook to protect the page

  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    orderUpdates: true,
    promotions: false
  });

  const [preferences, setPreferences] = useState({
    defaultPayment: 'Pay on Pickup',
    language: 'English',
    remindBeforeLunch: true,
    autoRefreshOrderStatus: false
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSignOut = () => {
    logout();
    // AuthContext logout already handles navigation to '/'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-amber-100">Manage your account preferences</p>
          </div>

          <div className="p-6">
            {/* App Preferences */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Palette className="h-5 w-5 text-amber-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">App Preferences</h2>
              </div>

              <div className="space-y-4">
                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Default Payment Method</p>
                        <p className="text-gray-500 text-sm">Choose your preferred payment option</p>
                      </div>
                    </div>

                    <select
                      value={preferences.defaultPayment}
                      onChange={(e) => setPreferences({ ...preferences, defaultPayment: e.target.value })}
                      className="bg-amber-50 border border-amber-200 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option>Pay on Pickup</option>
                      <option>Redirect Payment</option>
                    </select>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Notifications</p>
                        <p className="text-gray-500 text-sm">Manage your notification preferences</p>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <span className="text-gray-700 mr-2 text-sm">Order Updates</span>
                        <button
                          onClick={() => toggleNotification('orderUpdates')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.orderUpdates ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center">
                        <span className="text-gray-700 mr-2 text-sm">Promotions</span>
                        <button
                          onClick={() => toggleNotification('promotions')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.promotions ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.promotions ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Language</p>
                        <p className="text-gray-500 text-sm">Select your preferred language</p>
                      </div>
                    </div>

                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="bg-amber-50 border border-amber-200 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option>English</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Lock className="h-5 w-5 text-amber-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
              </div>

              <div className="space-y-4">
                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Change Password</p>
                        <p className="text-gray-500 text-sm">Update your password</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors">
                      Change
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Active Sessions</p>
                        <p className="text-gray-500 text-sm">Manage your active sessions</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors">
                      View
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300 hover:border-red-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Delete Account</p>
                        <p className="text-gray-500 text-sm">Permanently delete your account</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors">
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Order & Reminder Settings */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-amber-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Order & Reminder Settings</h2>
              </div>

              <div className="space-y-4">
                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Remind me before lunch</p>
                        <p className="text-gray-500 text-sm">Get a reminder before lunch time</p>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePreference('remindBeforeLunch')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.remindBeforeLunch ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.remindBeforeLunch ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Auto-refresh Order Status</p>
                        <p className="text-gray-500 text-sm">Automatically refresh order status</p>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePreference('autoRefreshOrderStatus')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.autoRefreshOrderStatus ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.autoRefreshOrderStatus ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Developer / Beta Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Palette className="h-5 w-5 text-amber-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Developer / Beta Features</h2>
              </div>

              <div className="space-y-4">
                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Palette className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Try new layout (Beta)</p>
                        <p className="text-gray-500 text-sm">Test the new interface design</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors">
                      Enable
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Account */}
            <div>
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-amber-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Account</h2>
              </div>

              <div className="space-y-4">
                <motion.div
                  className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-amber-500 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">View Profile</p>
                        <p className="text-gray-500 text-sm">See your profile information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/profile')}
                      className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      View
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  onClick={handleSignOut}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white font-medium transition-all duration-300 flex items-center justify-center cursor-pointer"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}