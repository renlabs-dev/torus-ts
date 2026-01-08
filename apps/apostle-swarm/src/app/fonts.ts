import { Cinzel_Decorative, Merriweather } from "next/font/google";

export const merriweather = Merriweather({
  subsets: ["latin"],
});

export const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel-decorative",
});
