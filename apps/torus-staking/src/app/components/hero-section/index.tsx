"use client";

import dynamic from "next/dynamic";

const ClientHeroSection = dynamic(() => import("./ClientHeroSection"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

const HeroSection = () => <ClientHeroSection />;

export { HeroSection };
