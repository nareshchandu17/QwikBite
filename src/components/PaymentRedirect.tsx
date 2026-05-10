'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  QrCode,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface PaymentRedirectProps {
  orderId: string;
  amount: number;
  upiId?: string;
  items?: OrderItem[];
  onPaymentComplete?: () => void;
}

const PaymentRedirect: React.FC<PaymentRedirectProps> = ({
  orderId,
  amount,
  upiId = 'qwikbite@upi',
  items = [],
  onPaymentComplete
}) => {
  // State management
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(items);
  
  // Generate UPI links for different payment apps
  const generateUpiLink = (appName: string) => {
    const baseUpiLink = `upi://pay?pa=${upiId}&pn=qwikBite&am=${amount}&cu=INR&tn=Order-${orderId}`;
    
    switch (appName) {
      case 'phonepe':
        return `phonepe://upi/pay?${baseUpiLink.split('?')[1]}`;
      case 'googlepay':
        return `tez://upi/pay?${baseUpiLink.split('?')[1]}`;
      case 'paytm':
        return `paytm://upi/pay?${baseUpiLink.split('?')[1]}`;
      default:
        return baseUpiLink;
    }
  };
  
  // Copy UPI link to clipboard
  const copyUpiLink = () => {
    const upiLink = `upi://pay?pa=${upiId}&pn=qwikBite&am=${amount}&cu=INR&tn=Order-${orderId}`;
    navigator.clipboard.writeText(upiLink);
    setCopied(true);
    toast.success('UPI link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle payment app redirect
  const redirectToApp = (appName: string) => {
    const upiLink = generateUpiLink(appName);
    
    try {
      window.location.href = upiLink;
    } catch (err) {
      toast.error(`Failed to open ${appName}. Please copy the UPI link manually.`);
      console.error(`Error opening ${appName}:`, err);
    }
  };
  
  // Confirm payment completion
  const confirmPayment = async () => {
    try {
      const response = await fetch('/api/payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: 'completed'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setPaymentStatus('completed');
        toast.success('Payment confirmed successfully!');
        
        // Call the callback if provided
        if (onPaymentComplete) {
          onPaymentComplete();
        }
      } else {
        throw new Error(data.error || 'Failed to confirm payment');
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      toast.error('Failed to confirm payment. Please try again.');
    }
  };
  
  // Calculate total amount
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Payment Options */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="text-slate-300">{item.name} ×{item.quantity}</span>
                  </div>
                  <span className="text-white">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-slate-700 my-4"></div>
            
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-white">Total</span>
              <span className="text-amber-400">Rs. {totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="mt-4 text-sm text-slate-400">
              <p>Order ID: {orderId}</p>
              <p>UPI ID: {upiId}</p>
            </div>
          </div>
          
          {/* Payment Options */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Pay Using</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PhonePe */}
              <button
                onClick={() => redirectToApp('phonepe')}
                className="p-4 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-700/50 transition-all flex flex-col items-center group"
              >
                <div className="bg-blue-500 p-3 rounded-full mb-3">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-white group-hover:text-amber-400 transition-colors">PhonePe</span>
                <span className="text-xs text-slate-400 mt-1">Tap to pay</span>
              </button>
              
              {/* Google Pay */}
              <button
                onClick={() => redirectToApp('googlepay')}
                className="p-4 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-700/50 transition-all flex flex-col items-center group"
              >
                <div className="bg-blue-400 p-3 rounded-full mb-3">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-white group-hover:text-amber-400 transition-colors">Google Pay</span>
                <span className="text-xs text-slate-400 mt-1">Tap to pay</span>
              </button>
              
              {/* Paytm */}
              <button
                onClick={() => redirectToApp('paytm')}
                className="p-4 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-700/50 transition-all flex flex-col items-center group"
              >
                <div className="bg-blue-600 p-3 rounded-full mb-3">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-white group-hover:text-amber-400 transition-colors">Paytm</span>
                <span className="text-xs text-slate-400 mt-1">Tap to pay</span>
              </button>
              
              {/* QR Code */}
              <button
                onClick={() => document.getElementById('qr-modal')?.classList.remove('hidden')}
                className="p-4 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-700/50 transition-all flex flex-col items-center group"
              >
                <div className="bg-green-500 p-3 rounded-full mb-3">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-white group-hover:text-amber-400 transition-colors">QR Code</span>
                <span className="text-xs text-slate-400 mt-1">Scan to pay</span>
              </button>
            </div>
            
            {/* Manual UPI Link */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Manual UPI Link</span>
                <button
                  onClick={copyUpiLink}
                  className="flex items-center text-sm text-amber-400 hover:text-amber-300"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-xs text-slate-400 break-all">
                  upi://pay?pa={upiId}&pn=qwikBite&am={amount}&cu=INR&tn=Order-{orderId}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - QR Code and Confirmation */}
        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Scan QR Code</h2>
            
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl mb-4">
                <QRCodeSVG 
                  value={`upi://pay?pa=${upiId}&pn=qwikBite&am=${amount}&cu=INR&tn=Order-${orderId}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-slate-300 text-center mb-4">
                Scan this QR code with any UPI app to complete your payment
              </p>
              <button
                onClick={copyUpiLink}
                className="flex items-center text-amber-400 hover:text-amber-300"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy UPI Link
              </button>
            </div>
          </div>
          
          {/* Payment Confirmation */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Confirm Payment</h2>
            
            {paymentStatus === 'completed' ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
                <p className="text-slate-300 mb-4">
                  Your payment of Rs. {amount.toFixed(2)} has been confirmed.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-amber-500/10 p-4 rounded-xl mb-4">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                  <p className="text-slate-300">
                    After completing your payment through any of the above methods, 
                    please confirm below to notify us.
                  </p>
                </div>
                
                <button
                  onClick={confirmPayment}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Payment Completed? Confirm
                </button>
                
                <p className="text-slate-400 text-xs mt-4">
                  Note: Please ensure your payment is completed before confirming.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* QR Code Modal */}
      <div id="qr-modal" className="hidden fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Scan to Pay</h3>
            <button
              onClick={() => document.getElementById('qr-modal')?.classList.add('hidden')}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl mb-4">
              <QRCodeSVG 
                value={`upi://pay?pa=${upiId}&pn=qwikBite&am=${amount}&cu=INR&tn=Order-${orderId}`}
                size={250}
                level="H"
              />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-slate-300 mb-2">
                Scan this QR code with any UPI app
              </p>
              <p className="text-amber-400 font-medium">
                Amount: Rs. {amount.toFixed(2)}
              </p>
            </div>
            
            <button
              onClick={() => document.getElementById('qr-modal')?.classList.add('hidden')}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRedirect;