import { Cormorant_Garamond, Merriweather } from "next/font/google";

export const merriweather = Merriweather({
  subsets: ["latin"],
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
});
