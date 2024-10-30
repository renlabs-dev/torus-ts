import { Cairo, Fira_Mono as FiraMono, Oxanium } from "next/font/google";

export const cairo = Cairo({
  subsets: ["latin"],
  display: "swap",
});

export const oxanium = Oxanium({
  subsets: ["latin"],
  display: "swap",
  weight: "300",
});

export const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});
