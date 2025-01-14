import "../styles/globals.css";

import type { Metadata } from "next";

// import { ToastProvider } from "@torus-ts/toast-provider";
// import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui";

// import { env } from "~/env";
// import { TRPCReactProvider } from "~/trpc/react";
// import { DelegatedList } from "./components/delegated-list";
// import { AllocatorHeader } from "./components/allocator-header";
// import { TutorialDialog } from "./components/tutorial-dialog";
import { Fira_Mono as FiraMono } from "next/font/google";
import Link from "next/link";

const APP_NAME = "Allocator";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite Allocator.",
};

export const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default function RootLayout(): JSX.Element {
  // {
  //   children,
  // }: {
  //   children: React.ReactNode;
  // }
  return (
    <Layout font={firaMono}>
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <span className="max-w-xl space-y-1 px-4 text-center text-lg text-white">
          <h3>Under construction...</h3>
          <h3>
            The Allocator is a permissionless web platform maintained by
            Renlabs, enabling stakeholders to allocate incentive weights among
            Agents.
          </h3>
          <h3>
            For more information check{" "}
            <Link
              href="https://dao.torus.network/agent-application/1"
              className="text-blue-500"
            >
              here
            </Link>
            .
          </h3>
        </span>
      </div>

      {/* <ToastProvider>
        <TorusProvider
          wsEndpoint={env.NEXT_PUBLIC_TORUS_RPC_URL}
          torusCacheUrl={env.NEXT_PUBLIC_TORUS_CACHE_URL}
        >
          <TRPCReactProvider>
            <AllocatorHeader />
            <TutorialDialog />
            <DelegatedList />
            {children}
          </TRPCReactProvider>
        </TorusProvider>
      </ToastProvider> */}
    </Layout>
  );
}
