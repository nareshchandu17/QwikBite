'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef, FormEvent } from 'react';

import React from 'react';
import { Header } from '@/components/home/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { TrendingSection } from '@/components/home/TrendingSection';
import { ScrollytellingCardStack } from '@/components/home/ScrollytellingCardStack';
import { DealsSection } from '@/components/home/DealsSection';
import { SocialProofSection } from '@/components/home/SocialProofSection';
import { CTASection } from '@/components/home/CTASection';
import { Footer } from '@/components/home/Footer';

export default function HomePage() {
  return (
    <main>
      <Header />
      <HeroSection />
      <TrendingSection />
      <ScrollytellingCardStack />
      <DealsSection />
      <SocialProofSection />
      <CTASection />
      <Footer />
    </main>
  );
}
