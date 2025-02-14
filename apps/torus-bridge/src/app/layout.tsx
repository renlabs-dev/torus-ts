import "../styles/globals.css";
import { Layout } from "@torus-ts/ui";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { AppContextProvider } from "~/context/app-context-provider";
import { EnvScript } from "~/env";

export const metadata: Metadata = {
  robots: "all",
  title: "Torus Base Bridge",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description:
    "Simple, secure, and easy-to-use wallet for the torus ecosystem.",
};

export const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <AppContextProvider>{children}</AppContextProvider>
    </Layout>
  );
}
