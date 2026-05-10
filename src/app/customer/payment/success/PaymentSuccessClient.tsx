'use client';

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

// ... (keep all your existing imports and types)

interface PaymentSuccessClientProps {
  userIp: string;
}

export function PaymentSuccessClient({ userIp }: PaymentSuccessClientProps) {
  // ... (copy all the existing component code from page.tsx)
  // Replace the metadata.ip with userIp from props
  // ... (rest of the component code)
  
  // In the processOrder function, update the metadata to use userIp:
  const processOrder = async () => {
    try {
      // ... existing code
      
      const transactionData = {
        // ... other fields
        metadata: {
          ip: userIp,  // Use the prop instead of session.user?.ip
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
        }
      };
      
      // ... rest of the function
    } catch (error) {
      // ... error handling
    }
  };
  
  // ... rest of the component code
}
