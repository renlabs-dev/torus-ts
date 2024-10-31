import { Footer, Header } from "@torus-ts/ui/components";

import "../styles/globals.css";

import type { Metadata } from "next";

import { firaMono } from "~/utils/fonts";

export const metadata: Metadata = {
  robots: "all",
  title: "𝐓𝐨𝐫𝐮𝐬",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Most advanced decentralized AI Protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body
        className={`bg-[#04061C] bg-[url('/bg-pattern.svg')] bg-cover text-gray-200 ${firaMono.className} overscroll-none`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
