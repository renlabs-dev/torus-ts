import { Cinzel, Cormorant_Garamond, Merriweather } from "next/font/google";

export const merriweather = Merriweather({
  subsets: ["latin"],
});

export const cinzelInscription = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cinzel-inscription",
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
});
