/* eslint-disable no-restricted-properties */
import type { ReactNode } from "react";

import { ReactQueryProvider } from "./context/react-query";
import { ToastProvider } from "./context/toast";
import { TorusProvider } from "./context/torus";

function Providers({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ReactQueryProvider>
      <ToastProvider>
        <TorusProvider
          // TODO: refactor as parameters
          wsEndpoint={String(process.env.NEXT_PUBLIC_WS_PROVIDER_URL)}
          torusCacheUrl={String(process.env.NEXT_PUBLIC_CACHE_PROVIDER_URL)}
        >
          {children}
        </TorusProvider>
      </ToastProvider>
    </ReactQueryProvider>
  );
}

export { Providers };
