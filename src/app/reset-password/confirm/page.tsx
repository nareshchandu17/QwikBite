'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SetNewPasswordCard, PasswordResetSuccessCard } from '@/components/auth';

function ResetPasswordConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token && !isSuccess) {
    return (
      <div className="text-center py-6 space-y-6">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-[2rem] bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
            <AlertTriangle className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-[#2d1b14] tracking-tight text-2xl font-bold leading-tight">
          Invalid or Missing Token
        </h2>
        <p className="text-[#5c4d47] text-sm font-medium leading-relaxed max-w-[320px] mx-auto">
          We couldn&apos;t find a valid password reset token in the URL. Your link might have expired or been copied incorrectly.
        </p>
        <div className="pt-4 space-y-3">
          <Link
            href="/reset-password"
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#f96124] to-[#ffb347] hover:brightness-105 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center shadow-lg transition-all"
          >
            Request New Reset Link
          </Link>
          <Link
            href="/auth/signin"
            className="w-full py-3.5 px-6 rounded-full border-2 border-orange-50 hover:bg-orange-50 text-[#5c4d47] text-sm font-bold flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to login
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <PasswordResetSuccessCard
        onBackToSignIn={() => router.push('/auth/signin')}
        className="shadow-none border-none max-w-full p-0 rounded-none bg-transparent dark:bg-transparent"
      />
    );
  }

  return (
    <SetNewPasswordCard
      token={token}
      isModal={false}
      onSuccess={() => setIsSuccess(true)}
      onBackToSignIn={() => router.push('/auth/signin')}
      className="shadow-none border-none max-w-full p-0 rounded-none bg-transparent dark:bg-transparent"
    />
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fffbf9] relative overflow-hidden">
      {/* Background mesh gradients */}
      <style jsx global>{`
        .bg-mesh-light {
          background-color: #fffbf9;
          background-image: 
            radial-gradient(at 0% 0%, rgba(249, 97, 36, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(255, 179, 71, 0.1) 0px, transparent 50%),
            radial-gradient(at 50% 100%, rgba(139, 69, 19, 0.05) 0px, transparent 50%);
        }
      `}</style>

      {/* Floating background orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-100/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-orange-100 px-6 py-4 md:px-40 bg-white/70 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-4 text-[#f96124]">
          <div className="size-8">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
              <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold leading-tight tracking-[-0.015em]">qwikBite</h1>
        </Link>
        <div className="hidden md:flex flex-1 justify-end gap-8">
          <nav className="flex items-center gap-9">
            <Link href="/customer" className="text-[#2d1b14] text-sm font-semibold hover:text-[#f96124] transition-colors">
              Canteens
            </Link>
            <Link href="/customer/menu" className="text-[#2d1b14] text-sm font-semibold hover:text-[#f96124] transition-colors">
              Menu
            </Link>
            <Link href="/customer/orders" className="text-[#2d1b14] text-sm font-semibold hover:text-[#f96124] transition-colors">
              Orders
            </Link>
          </nav>
          <Link
            href="/auth/signin"
            className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-[#f96124] text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 bg-mesh-light relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white w-full max-w-[480px] rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(45,27,20,0.08)] relative z-10 border border-orange-50/50"
        >
          <Suspense
            fallback={
              <div className="text-center py-12 space-y-4">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#f96124]"></div>
                <p className="text-[#5c4d47] text-sm font-medium">Verifying reset link...</p>
              </div>
            }
          >
            <ResetPasswordConfirmContent />
          </Suspense>

          {/* Security Message */}
          <div className="mt-8 flex items-center justify-center gap-2.5 px-6 py-3 bg-stone-50 rounded-2xl">
            <Shield className="text-[#f96124]/60 text-lg" />
            <p className="text-[10px] font-bold text-stone-500 leading-tight text-center uppercase tracking-widest">
              Security first: We verify every request before updating.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
