'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Toast, ToastType } from '@/types/ui';

type UIContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showThankYouModal: (orderDetails: unknown) => void;
  setLoading: (isLoading: boolean) => void;
  isLoading: boolean;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    if (type !== 'error') {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  const showThankYouModal = useCallback((details: unknown) => {
    setOrderDetails(details);
    setIsThankYouModalOpen(true);
  }, []);

  const closeThankYouModal = useCallback(() => {
    setIsThankYouModalOpen(false);
  }, []);

  const value = {
    showToast,
    showThankYouModal,
    setLoading: setIsLoading,
    isLoading,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
      {/* Toast container will be rendered here */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-md shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            } text-white`}
            onClick={() => dismissToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Thank you modal - simplified version */}
      {isThankYouModalOpen && orderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
            <p className="mb-4">Your order has been placed successfully.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeThankYouModal}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Handle reorder
                  closeThankYouModal();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Reorder
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
