"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Loader2, Lock, ChevronDown, Eye, EyeOff, Shield, Smartphone, CreditCard, Wallet, School, ShieldCheck, Bolt, Handshake, Mail, Utensils, ArrowRight, Calendar, HelpCircle, Info, AlertCircle } from "lucide-react";
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';

interface OrderData {
  id: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  timeSlot?: string;
  status?: string;
}

type PaymentMethodType = "upi" | "card" | "wallet" | "cod";

interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  icon: React.ReactNode;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "upi",
    name: "UPI",
    icon: <Bolt className="w-5 h-5" />
  },
  {
    id: "card",
    name: "Debit/Credit",
    icon: <CreditCard className="w-5 h-5" />
  },
  {
    id: "wallet",
    name: "Wallet",
    icon: <Wallet className="w-5 h-5" />
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    icon: <Handshake className="w-5 h-5" />
  }
];

export default function PremiumPaymentPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("upi");
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("paytm");
  const [upiStatus, setUpiStatus] = useState<"idle" | "checking" | "success" | "error" | "disabled">("idle");
  
  // Card validation states
  const [cardNumberValid, setCardNumberValid] = useState(false);
  const [expiryValid, setExpiryValid] = useState(false);
  const [cvvValid, setCvvValid] = useState(false);
  const [cardFieldTouched, setCardFieldTouched] = useState(false);
  const [expiryFieldTouched, setExpiryFieldTouched] = useState(false);
  const [cvvFieldTouched, setCvvFieldTouched] = useState(false);
  const { clearCart } = useCartStore();

  // 🔍 UPI Validation
  useEffect(() => {
    if (!upiId) {
      setUpiStatus("idle");
      return;
    }

    const validUpiRegex = /^[\w.-]+@[\w.-]+$/;
    setUpiStatus("checking");

    const timer = setTimeout(() => {
      if (validUpiRegex.test(upiId)) {
        setUpiStatus("success");
      } else {
        setUpiStatus("error");
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [upiId]);

  // 🔍 Check if payment button should be enabled
  const isPaymentEnabled = () => {
    if (processing) return false;
    
    switch (selectedMethod) {
      case "cod":
        return true; // Cash on delivery is always enabled
      case "upi":
        return upiStatus === "success";
      case "card":
        return cardNumberValid && expiryValid && cvvValid;
      case "wallet":
        return true; // Wallet payment (assuming It&apos;s always enabled for now)
      default:
        return false;
    }
  };

  // 🔍 Card Validation Logic
  useEffect(() => {
    // Card Number: 16 digits and Luhn check
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    const is16Digits = /^\d{16}$/.test(cleanCardNumber);
    
    // Basic Luhn algorithm
    let sum = 0;
    let isEven = false;
    for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanCardNumber[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    const passesLuhn = sum % 10 === 0;
    
    setCardNumberValid(is16Digits && passesLuhn);
  }, [cardNumber]);

  useEffect(() => {
    // Expiry: MM/YY format and valid date
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) {
      setExpiryValid(false);
      return;
    }

    const [month, year] = expiry.split('/').map(Number);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    // Check if expiry is in the future
    const isFuture = year > currentYear || (year === currentYear && month >= currentMonth);
    setExpiryValid(isFuture);
  }, [expiry]);

  useEffect(() => {
    // CVV: 3-4 digits
    const cvvRegex = /^\d{3,4}$/;
    setCvvValid(cvvRegex.test(cvv));
  }, [cvv]);

  useEffect(() => {
    const stored = localStorage.getItem("orderData");
    if (stored) {
      try {
        setOrder(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing order data:', error);
        toast.error('Invalid order data. Please try again.');
        router.push('/customer/order-summary');
      }
    } else {
      toast.error('No order found. Please place an order first.');
      router.push('/customer/order-summary');
    }
  }, [router]);

  const handlePay = async () => {
    if (!order) return;
    
    setProcessing(true);
    
    try {
      localStorage.setItem("selectedPaymentMethod", selectedMethod);
      // Navigate to processing page first
      router.push("/customer/payment/processing");
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8f6f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f96124]" />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f5] min-h-screen font-sans text-[#1c110d]">
      

      <main className="w-full px-[5%] py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#1c110d] mb-2">Secure Payment</h1>
          <p className="text-[#9e6047] text-lg">Complete your order securely via our campus-verified gateway.</p>
        </div>

        <div className="grid grid-cols-[65fr_35fr] gap-12">
          <div className="flex flex-col gap-8">
            {/* Payment Method Tabs */}
            <section>
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <span className="text-[#f96124]">
                  <CreditCard className="w-6 h-6" />
                </span>
                Select Payment Method
              </h3>
              <div className="flex border-b border-[#e9d5ce] gap-8 overflow-x-auto pb-px">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex flex-col items-center border-b-[3px] gap-1 pb-4 pt-2 group min-w-[120px] cursor-pointer ${
                      selectedMethod === method.id
                        ? "border-[#f96124] text-[#f96124]"
                        : "border-transparent text-[#9e6047] hover:text-[#f96124] transition-colors"
                    }`}
                  >
                    {method.icon}
                    <p className="text-sm font-bold">{method.name}</p>
                  </button>
                ))}
              </div>

              {/* Payment Method Content */}
              <div className="mt-8 p-8 rounded-xl bg-white shadow-sm border border-[#e9d5ce]">
                <div className="flex flex-col gap-8">
                  {selectedMethod === "upi" && (
                    <div>
                      <label className="block mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[#1c110d] text-lg font-bold">Pay using UPI ID</p>
                          <span className="text-xs text-[#9e6047] uppercase font-bold tracking-wider">Fastest</span>
                        </div>
                        <div className="space-y-2">
                          <div
                            className={`
                              flex items-center gap-4 h-14 rounded-lg px-4 transition-all
                              
                              ${upiStatus === "idle" && "border border-[#e9d5ce]"}
                              ${upiStatus === "checking" && "border border-[#f96124] shadow-[0_0_0_3px_rgba(249,97,36,0.1)] shadow-[0_0_20px_rgba(249,97,36,0.3)]"}
                              ${upiStatus === "success" && "border border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.1)] shadow-[0_0_20px_rgba(34,197,94,0.3)]"}
                              ${upiStatus === "error" && "border border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)] shadow-[0_0_20px_rgba(239,68,68,0.3)]"}
                            `}
                          >
                            <Mail className="w-5 h-5 text-[#f96124] shrink-0" />

                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="Enter UPI ID (e.g., student@okaxis)"
                              autoComplete="off"
                              className="
                                flex-1
                                bg-transparent
                                text-lg
                                text-[#1c110d]
                                placeholder:text-[#9e6047]/60

                                !border-0
                                !outline-none
                                !ring-0
                                !shadow-none

                                focus:!outline-none
                                focus:!ring-0
                                focus:!border-0
                                focus:!shadow-none

                                appearance-none
                              "
                            />

                            {/* RIGHT STATUS ICON */}
                            <div className="w-5 h-5 flex items-center justify-center">
                              {upiStatus === "checking" && (
                                <Loader2 className="w-5 h-5 animate-spin text-[#f96124]" />
                              )}

                              {upiStatus === "success" && (
                                <Check className="w-5 h-5 text-green-600" style={{ animation: 'scale-in 0.25s ease-out' }} />
                              )}

                              {upiStatus === "error" && (
                                <AlertCircle className="w-5 h-5 text-red-600" style={{ animation: 'shake 0.35s ease-in-out' }} />
                              )}
                            </div>
                          </div>

                          {/* HELPER TEXT */}
                          {upiStatus === "error" && (
                            <p className="text-sm text-red-600 flex items-center gap-1" style={{ animation: 'fade-in 0.2s ease-out' }}>
                              Invalid UPI ID format
                            </p>
                          )}

                          {upiStatus === "success" && (
                            <p className="text-sm text-green-600 flex items-center gap-1" style={{ animation: 'fade-in 0.2s ease-out' }}>
                              UPI ID verified successfully
                            </p>
                          )}
                        </div>




                        <p className="mt-2 text-sm text-[#9e6047] italic">A payment request will be sent to your UPI app.</p>
                      </label>
                    </div>
                  )}

                  {selectedMethod === "card" && (
                    <div className="flex flex-col gap-10">
                      <div className="relative w-full max-w-[420px] mx-auto aspect-[1.58/1] rounded-2xl p-8 text-white shadow-2xl overflow-hidden bg-gradient-to-br from-[#f96124] via-[#fb923c] to-[#fcd34d]">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
                        <div className="relative h-full flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-lg opacity-90 shadow-inner"></div>
                            <div className="flex gap-1">
                              <div className="w-8 h-8 rounded-full bg-red-500/80"></div>
                              <div className="w-8 h-8 rounded-full bg-yellow-500/80 -ml-4"></div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="text-2xl font-mono tracking-[0.2em] shadow-sm">
                              {cardNumber ? cardNumber.replace(/(.{4})/g, '$1 ').trim() : '••••  ••••  ••••  ••••'}
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-widest opacity-80">Card Holder</p>
                                <p className="text-sm font-bold tracking-wider uppercase">Student Name</p>
                              </div>
                              <div className="space-y-1 text-right">
                                <p className="text-[10px] uppercase tracking-widest opacity-80">Expires</p>
                                <p className="text-sm font-bold tracking-wider">{expiry || 'MM/YY'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                          <div className={`flex items-center gap-4 h-14 rounded-lg px-4 transition-all border bg-[#f8f6f5] focus-within:border-[#f96124] focus-within:shadow-[0_0_0_3px_rgba(249,97,36,0.1)] focus-within:shadow-[0_0_20px_rgba(249,97,36,0.3)] ${
                            !cardFieldTouched || cardNumber.length === 0 ? 'border-[#e9d5ce]' : 
                            cardNumberValid ? 'border-green-500' : 'border-red-500'
                          }`}>
                            <CreditCard className="w-5 h-5 text-[#f96124] shrink-0" />
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim())}
                              onBlur={() => setCardFieldTouched(true)}
                              placeholder="Card Number"
                              className="flex-1 bg-[#f8f6f5] text-lg text-[#1c110d] placeholder:text-[#9e6047]/60 !border-0 !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none appearance-none"
                            />
                            <div className="flex gap-2">
                              <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                              <div className="w-8 h-5 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">MC</div>
                            </div>
                            <AnimatePresence>
                              {cardNumberValid && cardNumber.length > 0 && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  transition={{ duration: 0.25 }}
                                >
                                  <Check className="w-5 h-5 text-green-600" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {cardFieldTouched && cardNumber.length > 0 && !cardNumberValid && (
                            <p className="text-sm text-red-600" style={{ animation: 'fade-in 0.2s ease-out' }}>
                              Invalid card number
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className={`flex items-center gap-4 h-14 rounded-lg px-4 transition-all border bg-[#f8f6f5] focus-within:border-[#f96124] focus-within:shadow-[0_0_0_3px_rgba(249,97,36,0.1)] focus-within:shadow-[0_0_20px_rgba(249,97,36,0.3)] ${
                            !expiryFieldTouched || expiry.length === 0 ? 'border-[#e9d5ce]' : 
                            expiryValid ? 'border-green-500' : 'border-red-500'
                          }`}>
                            <Calendar className="w-5 h-5 text-[#f96124] shrink-0" />
                            <input
                              type="text"
                              value={expiry}
                              onChange={(e) => setExpiry(e.target.value.replace(/[^0-9/]/g, '').replace(/^(\d{2})(\d)/, '$1/$2').slice(0, 5))}
                              onBlur={() => setExpiryFieldTouched(true)}
                              placeholder="MM/YY"
                              className="flex-1 bg-transparent text-lg text-[#1c110d] placeholder:text-[#9e6047]/60 !border-0 !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none appearance-none"
                            />
                            <AnimatePresence>
                              {expiryValid && expiry.length > 0 && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  transition={{ duration: 0.25 }}
                                >
                                  <Check className="w-5 h-5 text-green-600" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {expiryFieldTouched && expiry.length > 0 && !expiryValid && (
                            <p className="text-sm text-red-600" style={{ animation: 'fade-in 0.2s ease-out' }}>
                              Invalid expiry date
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className={`flex items-center gap-4 h-14 rounded-lg px-4 transition-all border bg-[#f8f6f5] focus-within:border-[#f96124] focus-within:shadow-[0_0_0_3px_rgba(249,97,36,0.1)] focus-within:shadow-[0_0_20px_rgba(249,97,36,0.3)] ${
                            !cvvFieldTouched || cvv.length === 0 ? 'border-[#e9d5ce]' : 
                            cvvValid ? 'border-green-500' : 'border-red-500'
                          }`}>
                            <Lock className="w-5 h-5 text-[#f96124] shrink-0" />
                            <input
                              type="password"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              onBlur={() => setCvvFieldTouched(true)}
                              placeholder="CVV"
                              className="flex-1 bg-transparent text-lg text-[#1c110d] placeholder:text-[#9e6047]/60 !border-0 !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none appearance-none"
                            />
                            <div className="group cursor-help">
                              <HelpCircle className="text-[#9e6047] text-xl" />
                              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-white text-[10px] rounded hidden group-hover:block z-20">
                                The 3-digit security code on the back of your card.
                              </div>
                            </div>
                            <AnimatePresence>
                              {cvvValid && cvv.length > 0 && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  transition={{ duration: 0.25 }}
                                >
                                  <Check className="w-5 h-5 text-green-600" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {cvvFieldTouched && cvv.length > 0 && !cvvValid && (
                            <p className="text-sm text-red-600" style={{ animation: 'fade-in 0.2s ease-out' }}>
                              Invalid CVV
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === "wallet" && (
                    <div className="flex flex-col gap-6">
                      <label className="relative block group cursor-pointer">
                        <input 
                          className="peer hidden" 
                          name="wallet" 
                          type="radio"
                          checked={selectedWallet === "paytm"}
                          onChange={() => setSelectedWallet("paytm")}
                        />
                        <div className="p-5 rounded-xl border border-[#e9d5ce] bg-white flex items-center justify-between transition-all peer-checked:border-[#f96124] peer-checked:shadow-md">
                          <div className="flex items-center gap-5">
                            <div className="size-12 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 p-2">
                              <div className="w-full h-6 bg-[#5f259f] rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">PP</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-lg">Paytm Wallet</p>
                                <span className="bg-[#f96124]/10 text-[#f96124] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Recommended</span>
                                <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  BEST OFFERS
                                </span>
                              </div>
                              <p className="text-sm text-[#9e6047]">Balance: <span className="font-bold text-[#1c110d]">₹245.50</span></p>
                            </div>
                          </div>
                          <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedWallet === "paytm" ? "border-[#f96124]" : "border-[#e9d5ce]"
                          }`}>
                            <div className={`size-3 rounded-full bg-[#f96124] transition-transform ${
                              selectedWallet === "paytm" ? "scale-100" : "scale-0"
                            }`}></div>
                          </div>
                        </div>
                      </label>

                      <label className="relative block group cursor-pointer">
                        <input 
                          className="peer hidden" 
                          name="wallet" 
                          type="radio"
                          checked={selectedWallet === "phonepe"}
                          onChange={() => setSelectedWallet("phonepe")}
                        />
                        <div className="p-5 rounded-xl border border-[#e9d5ce] bg-white flex items-center justify-between transition-all peer-checked:border-[#f96124] peer-checked:shadow-md">
                          <div className="flex items-center gap-5">
                            <div className="size-12 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 p-2">
                              <div className="w-full h-6 bg-[#5f259f] rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">PP</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-lg">PhonePe Wallet</p>
                              <p className="text-sm text-[#9e6047]">Balance: <span className="font-bold text-[#1c110d]">₹12.00</span></p>
                            </div>
                          </div>
                          <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedWallet === "phonepe" ? "border-[#f96124]" : "border-[#e9d5ce]"
                          }`}>
                            <div className={`size-3 rounded-full bg-[#f96124] transition-transform ${
                              selectedWallet === "phonepe" ? "scale-100" : "scale-0"
                            }`}></div>
                          </div>
                        </div>
                      </label>

                      <label className="relative block group cursor-pointer">
                        <input 
                          className="peer hidden" 
                          name="wallet" 
                          type="radio"
                          checked={selectedWallet === "amazon"}
                          onChange={() => setSelectedWallet("amazon")}
                        />
                        <div className="p-5 rounded-xl border border-[#e9d5ce] bg-white flex items-center justify-between transition-all peer-checked:border-[#f96124] peer-checked:shadow-md">
                          <div className="flex items-center gap-5">
                            <div className="size-12 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 p-2">
                              <div className="w-full h-6 bg-orange-500 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">AP</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-lg">Amazon Pay</p>
                              <p className="text-sm text-[#f96124] font-bold">Link Account</p>
                            </div>
                          </div>
                          <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedWallet === "amazon" ? "border-[#f96124]" : "border-[#e9d5ce]"
                          }`}>
                            <div className={`size-3 rounded-full bg-[#f96124] transition-transform ${
                              selectedWallet === "amazon" ? "scale-100" : "scale-0"
                            }`}></div>
                          </div>
                        </div>
                      </label>

                      <label className="relative block group cursor-pointer">
                        <input 
                          className="peer hidden" 
                          name="wallet" 
                          type="radio"
                          checked={selectedWallet === "mobikwik"}
                          onChange={() => setSelectedWallet("mobikwik")}
                        />
                        <div className="p-5 rounded-xl border border-[#e9d5ce] bg-white flex items-center justify-between transition-all peer-checked:border-[#f96124] peer-checked:shadow-md">
                          <div className="flex items-center gap-5">
                            <div className="size-12 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 p-1">
                              <div className="w-full h-6 bg-[#00579e] rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">MK</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-lg">MobiKwik</p>
                              <p className="text-sm text-[#9e6047]">Balance: <span className="font-bold text-[#1c110d]">₹0.00</span></p>
                            </div>
                          </div>
                          <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedWallet === "mobikwik" ? "border-[#f96124]" : "border-[#e9d5ce]"
                          }`}>
                            <div className={`size-3 rounded-full bg-[#f96124] transition-transform ${
                              selectedWallet === "mobikwik" ? "scale-100" : "scale-0"
                            }`}></div>
                          </div>
                        </div>
                      </label>

                      <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
                        <Info className="text-blue-600" />
                        <p className="text-sm text-blue-800">
                          Linking your wallet allows for 1-click checkout. Your credentials are encrypted and never stored on qwikBite servers.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedMethod === "cod" && (
                    <div className="flex flex-col items-center text-center py-8">
                      <div className="size-20 bg-[#f96124]/10 rounded-full flex items-center justify-center mb-6">
                        <Handshake className="w-10 h-10 text-[#f96124]" />
                      </div>
                      <h4 className="text-2xl font-black mb-3">Pay when your food arrives! 🍔</h4>
                      <p className="max-w-md text-[#9e6047] mb-6">
                        Please keep the exact amount ready for a faster handover. A small COD fee of ₹5 may apply.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full uppercase tracking-wider border border-green-100">
                        <Check className="w-4 h-4" />
                        No upfront payment needed
                      </div>
                    </div>
                  )}

                  
                </div>
              </div>
            </section>

            {/* Security Features */}
            <section className="flex flex-wrap gap-8 justify-between items-center border-t border-[#e9d5ce] pt-8 opacity-90">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">SSL Secured</p>
                  <p className="text-[12px] text-[#9e6047]">256-bit encryption</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">Campus Verified</p>
                  <p className="text-[12px] text-[#9e6047]">Official University Pay</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">Fraud Protection</p>
                  <p className="text-[12px] text-[#9e6047]">Auto-reversal enabled</p>
                </div>
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-[#e9d5ce] overflow-hidden sticky top-24">
              <div className="bg-[#f96124]/5 px-6 py-4 border-b border-[#e9d5ce]">
                <h3 className="text-lg font-black uppercase tracking-wider">Payment Details</h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-[#9e6047] font-bold uppercase tracking-widest">Order ID</p>
                      <p className="font-bold">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#9e6047] font-bold uppercase tracking-widest">Canteen</p>
                      <p className="font-bold text-nowrap">Main Street Hub</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Utensils className="w-4 h-4 text-[#f96124]" />
                    <span>{order.items.length} Items Selected</span>
                  </div>
                </div>
                <hr className="border-[#e9d5ce]" />
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-[#9e6047]">
                    <span>Subtotal</span>
                    <span>₹{(order.total * 0.848).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#9e6047]">
                    <span>GST (2.5%)</span>
                    <span>₹{(order.total * 0.152).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Campus Delivery</span>
                    <span className="font-bold">FREE</span>
                  </div>
                </div>
                <hr className="border-[#e9d5ce]" />
                <div className="flex justify-between items-center py-2">
                  <span className="text-xl font-bold">Total Payable</span>
                  <span className="text-3xl font-black text-[#f96124]">₹{order.total.toFixed(2)}</span>
                </div>
                <button
                  onClick={handlePay}
                  disabled={!isPaymentEnabled()}
                  className="w-full h-16 bg-gradient-to-r from-[#f96124] to-[#ff8e53] hover:opacity-90 transition-all rounded-lg text-white font-black text-lg flex items-center justify-center gap-3 shadow-[0_10px_20px_-10px_rgba(249,97,36,0.5)] disabled:opacity-60 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ₹{order.total.toFixed(2)} Securely
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <div className="text-center mt-2">
                  <button
                    onClick={() => router.push('/customer/order-summary')}
                    className="text-sm font-bold text-[#9e6047] hover:text-[#f96124] underline decoration-2 underline-offset-4 transition-colors cursor-pointer"
                  >
                    Cancel & return to order summary
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </main>

      
    </div>
  );
}
