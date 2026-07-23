'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Bell, Lock, User, CreditCard, Clock, Globe, LogOut, Palette, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCustomerGuard } from '@/hooks/use-customer-guard';
import { toast } from 'sonner';

export default function SettingsPage() {
  useCustomerGuard();

  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    const savedPreferences = localStorage.getItem('preferences');
    
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [betaLayout, setBetaLayout] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences]);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Notification preference updated');
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Preference updated');
  };

  const handleSignOut = () => {
    logout();
  };

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    // Simulate password change (in real app, call API)
    toast.success('Password changed successfully');
    setShowPasswordModal(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleViewSessions = () => {
    setShowSessionsModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    // Simulate account deletion (in real app, call API)
    toast.success('Account deleted successfully');
    logout();
  };

  const handleEnableBeta = () => {
    setBetaLayout(true);
    toast.success('Beta layout enabled');
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
                    <button 
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors"
                    >
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
                    <button 
                      onClick={handleViewSessions}
                      className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors"
                    >
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
                    <button 
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
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
                    <button 
                      onClick={handleEnableBeta}
                      className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {betaLayout ? 'Enabled' : 'Enable'}
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-semibold mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Change Password
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-semibold mb-4">Active Sessions</h3>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Current Session</p>
                    <p className="text-sm text-gray-500">Chrome on Windows • Active now</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Current</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Mobile App</p>
                    <p className="text-sm text-gray-500">iOS • Last active 2 hours ago</p>
                  </div>
                  <button className="text-red-600 text-sm hover:underline">Revoke</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSessionsModal(false)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-semibold mb-4 text-red-600">Delete Account</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}