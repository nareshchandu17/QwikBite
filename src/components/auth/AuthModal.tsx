'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SignInCard } from './SignInCard';
import { SignUpCard } from './SignUpCard';
import { ForgotPasswordCard } from './ForgotPasswordCard';
import { EmailConfirmationCard } from './EmailConfirmationCard';
import { SetNewPasswordCard } from './SetNewPasswordCard';
import { PasswordResetSuccessCard } from './PasswordResetSuccessCard';
import { useAuthModal } from '@/context/AuthModalContext';
import { useRouter } from 'next/navigation';

type AuthModalProps = {
  redirectOnSignIn?: boolean;
};

export function AuthModal({ redirectOnSignIn = false }: AuthModalProps) {
  const router = useRouter();
  const { isOpen, mode, redirectUrl, emailData, tokenData, closeModal, openModal } = useAuthModal();
  
  // Close modal when clicking outside
  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = (redirectUrl?: string) => {
    closeModal();
    // SignInCard handles the actual redirect, we just close the modal
    // The redirect happens via router.push in SignInCard after session is updated
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleBackgroundClick}
        >
          <motion.div
            className="relative w-full max-w-lg my-8 flex flex-col"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {mode === 'signin' ? (
              <SignInCard
                onSuccess={handleAuthSuccess}
                onSwitchToSignUp={() => {
                  closeModal();
                  // Open signup modal
                  setTimeout(() => {
                    openModal('signup');
                  }, 100);
                }}
                redirectOnSuccess={true}
                defaultRedirect={redirectUrl}
              />
            ) : mode === 'signup' ? (
              <SignUpCard
                onSuccess={handleAuthSuccess}
                onSwitchToSignIn={() => {
                  closeModal();
                  // Open signin modal
                  setTimeout(() => {
                    openModal('signin');
                  }, 100);
                }}
              />
            ) : mode === 'forgotpassword' ? (
              <ForgotPasswordCard
                onSuccess={handleAuthSuccess}
                onBackToSignIn={() => {
                  closeModal();
                  // Open signin modal
                  setTimeout(() => {
                    openModal('signin');
                  }, 100);
                }}
              />
            ) : mode === 'emailconfirmation' ? (
              <EmailConfirmationCard
                email={emailData?.email}
                onSuccess={handleAuthSuccess}
                onBackToSignIn={() => {
                  closeModal();
                  // Open signin modal
                  setTimeout(() => {
                    openModal('signin');
                  }, 100);
                }}
                onResend={async () => {
                  // Resend the reset link
                  if (emailData?.email) {
                    const response = await fetch('/api/auth/reset-password', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email: emailData.email }),
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to resend reset link');
                    }
                  }
                }}
              />
            ) : mode === 'setnewpassword' ? (
              <SetNewPasswordCard
                token={tokenData?.token}
                onSuccess={handleAuthSuccess}
                onBackToSignIn={() => {
                  closeModal();
                  // Open signin modal
                  setTimeout(() => {
                    openModal('signin');
                  }, 100);
                }}
              />
            ) : (
              <PasswordResetSuccessCard
                onSuccess={handleAuthSuccess}
                onBackToSignIn={() => {
                  closeModal();
                  // Open signin modal
                  setTimeout(() => {
                    openModal('signin');
                  }, 100);
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}