import { Space_Grotesk as SpaceGrotesk } from "next/font/google";

export const MAIN_FONT = SpaceGrotesk({
  subsets: ["latin"],
  variable: "--font-main",
  preload: true,
  fallback: ["sans-serif"],
});
export const APP_NAME = "Torus Schizonet";
export const APP_DESCRIPTION = "A DApp for Hyperlane Warp Route transfers";
export const APP_URL = "hyperlane-warp-template.vercel.app";
export const BRAND_COLOR = "FF00FF";
export const BACKGROUND_COLOR = "FF00FF";
export const BACKGROUND_IMAGE = "url(/backgrounds/main.svg)";
