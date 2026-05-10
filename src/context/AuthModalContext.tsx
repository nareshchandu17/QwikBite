'use client';

import React, { createContext, useContext, useState } from 'react';

type AuthModalContextType = {
  isOpen: boolean;
  mode: 'signin' | 'signup' | 'forgotpassword' | 'emailconfirmation' | 'setnewpassword' | 'passwordresetsuccess';
  redirectUrl?: string;
  emailData?: { email: string };
  tokenData?: { token: string };
  openModal: (mode: 'signin' | 'signup' | 'forgotpassword' | 'emailconfirmation' | 'setnewpassword' | 'passwordresetsuccess', redirectUrl?: string, emailData?: { email: string }, tokenData?: { token: string }) => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgotpassword' | 'emailconfirmation' | 'setnewpassword' | 'passwordresetsuccess'>('signin');
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>(undefined);
  const [emailData, setEmailData] = useState<{ email: string } | undefined>(undefined);
  const [tokenData, setTokenData] = useState<{ token: string } | undefined>(undefined);

  const openModal = (newMode: 'signin' | 'signup' | 'forgotpassword' | 'emailconfirmation' | 'setnewpassword' | 'passwordresetsuccess', redirectUrl?: string, emailData?: { email: string }, tokenData?: { token: string }) => {
    setMode(newMode);
    setRedirectUrl(redirectUrl);
    setEmailData(emailData);
    setTokenData(tokenData);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, mode, redirectUrl, emailData, tokenData, openModal, closeModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
