'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MessageCircle, ChevronDown, Upload, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function HelpSupportPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    issueType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const issueCategories = [
    {
      id: 'order',
      title: 'Order Issues',
      icon: '🧾',
      description: 'Problems with your orders',
      guidance: [
        'Check order status in "My Orders" section',
        'Verify delivery time and location',
        'Contact support if order is delayed or missing'
      ]
    },
    {
      id: 'payment',
      title: 'Payment Problems',
      icon: '💳',
      description: 'Issues with payments or refunds',
      guidance: [
        'Payment failed? Check UPI status and try again',
        'Refresh order page to see updated status',
        'Contact support if amount was deducted but order failed'
      ]
    },
    {
      id: 'login',
      title: 'Login/OTP Issues',
      icon: '🔐',
      description: 'Trouble signing in or receiving OTP',
      guidance: [
        'Check if email is registered in our system',
        'Ensure you\'re using the correct password',
        'Request a new OTP if the previous one expired'
      ]
    },
    {
      id: 'menu',
      title: 'Menu or Item Availability',
      icon: '🍔',
      description: 'Questions about menu items',
      guidance: [
        'Check if item is marked as "Available" in menu',
        'Some items may be seasonal or temporarily unavailable',
        'Suggest alternatives to our team for future inclusion'
      ]
    },
    {
      id: 'delivery',
      title: 'Delivery/Collection Issues',
      icon: '📦',
      description: 'Problems with delivery or pickup',
      guidance: [
        'Verify pickup time and location details',
        'Contact canteen staff if you\'re having trouble locating items',
        'Report missing items immediately upon pickup'
      ]
    }
  ];

  const commonQuestions = [
    {
      question: "Didn't receive OTP?",
      solution: "Check your spam folder, ensure email is correct, and request a new OTP after 2 minutes."
    },
    {
      question: "Order not updating?",
      solution: "Refresh the page or check back in 5 minutes. If still not updating, contact support."
    },
    {
      question: "Refund not shown?",
      solution: "Refunds typically process within 3-5 business days. Contact support if It&apos;s been longer."
    },
    {
      question: "can&apos;t find an item?",
      solution: "Some items may be seasonal. Check back later or suggest it in feedback."
    }
  ];

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, you would send the form data to your backend
      console.log('Form submitted:', formData);
      
      setIsSubmitted(true);
      toast.success('Thanks! We\'ll reach you soon.');
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          issueType: '',
          message: '',
        });
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero / Intro Section */}
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-amber-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Need Help?</h1>
            <p className="text-gray-600 mb-6">We&apos;re here to make your canteen experience smooth and easy.</p>
            <div className="flex justify-center">
              <div className="bg-amber-100 rounded-full p-4 w-24 h-24 flex items-center justify-center">
                <MessageCircle className="h-12 w-12 text-amber-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Contact Options */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Contact Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              className="bg-white rounded-xl p-6 border border-amber-200 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('tel:+91xxxxxxxxxx', '_self')}
            >
              <Phone className="h-8 w-8 text-amber-600 mb-2" />
              <span className="font-medium text-gray-900">Call Support</span>
            </motion.button>
            
            <motion.button
              className="bg-white rounded-xl p-6 border border-amber-200 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('mailto:support@qwikbite.com?subject=qwikBite Support Request', '_self')}
            >
              <Mail className="h-8 w-8 text-amber-600 mb-2" />
              <span className="font-medium text-gray-900">Email Support</span>
            </motion.button>
            
            <motion.button
              className="bg-white rounded-xl p-6 border border-amber-200 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('https://wa.me/91xxxxxxxxxx', '_blank')}
            >
              <MessageCircle className="h-8 w-8 text-amber-600 mb-2" />
              <span className="font-medium text-gray-900">Chat with Us</span>
            </motion.button>
          </div>
        </div>

        {/* Issue Type Selector */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What do you need help with?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issueCategories.map((category) => (
              <motion.div
                key={category.id}
                className="bg-white rounded-xl border border-amber-200 overflow-hidden cursor-pointer transition-all duration-300"
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.title}</h3>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`h-5 w-5 text-amber-600 transition-transform duration-200 ${
                        activeCategory === category.id ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>
                
                {activeCategory === category.id && (
                  <motion.div 
                    className="px-5 pb-5 border-t border-amber-100 pt-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ul className="space-y-2">
                      {category.guidance.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-amber-600 mr-2">•</span>
                          <span className="text-gray-700 text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-amber-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Form</h2>
          
          {isSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent Successfully!</h3>
              <p className="text-gray-600">Thanks! We&apos;ll reach you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Type
                </label>
                <select
                  id="issueType"
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                >
                  <option value="">Select an issue type</option>
                  <option value="order">Order Issues</option>
                  <option value="payment">Payment Problems</option>
                  <option value="login">Login/OTP Issues</option>
                  <option value="menu">Menu or Item Availability</option>
                  <option value="delivery">Delivery/Collection Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Describe your issue in detail..."
                  required
                ></textarea>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={handleFileUploadClick}
                  className="flex items-center text-amber-600 hover:text-amber-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Attach Screenshot (Optional)</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              
              <motion.button
                type="submit"
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Smart Suggestions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">People also asked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonQuestions.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-5 border border-amber-200 transition-all duration-300 hover:shadow-md"
                whileHover={{ y: -5 }}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm">{faq.solution}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-gray-600">
          <p>Still stuck? Reach us anytime at <a href="mailto:support@qwikbite.com" className="text-amber-600 hover:underline">support@qwikbite.com</a></p>
        </div>
      </div>
    </div>
  );
}
