import { Cairo, Fira_Mono, Oxanium } from "next/font/google";

export const firaMono = Fira_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const cairo = Cairo({
  subsets: ["latin"],
  display: "swap",
});

export const oxanium = Oxanium({
  subsets: ["latin"],
  display: "swap",
  weight: "300",
});
