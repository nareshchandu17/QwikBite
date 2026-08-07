import React from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/home/Header";
import { HeroSection } from "@/components/home/HeroSection";

// Dynamically import below-the-fold components to reduce initial bundle size
const TrendingSection = dynamic(() => import("@/components/home/TrendingSection").then(m => m.TrendingSection), { ssr: false });
const ScrollytellingCardStack = dynamic(() => import("@/components/home/ScrollytellingCardStack").then(m => m.ScrollytellingCardStack), { ssr: false });
const DealsSection = dynamic(() => import("@/components/home/DealsSection").then(m => m.DealsSection), { ssr: false });
const SocialProofSection = dynamic(() => import("@/components/home/SocialProofSection").then(m => m.SocialProofSection), { ssr: false });
const CTASection = dynamic(() => import("@/components/home/CTASection").then(m => m.CTASection), { ssr: false });
const Footer = dynamic(() => import("@/components/home/Footer").then(m => m.Footer), { ssr: false });

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
