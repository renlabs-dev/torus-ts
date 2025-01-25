"use client";

import dynamic from "next/dynamic";

const ClientHeroSection = dynamic(() => import("./ClientHeroSection"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

// This is now a Client Component
const HeroSection = () => <ClientHeroSection />;

export { HeroSection };
