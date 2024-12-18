import type { ReactNode } from "react";

import { ReactQueryProvider } from "./context/react-query";
import { ToastProvider } from "./context/toast";

function QueryProvider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ReactQueryProvider>
      <ToastProvider>{children}</ToastProvider>
    </ReactQueryProvider>
  );
}

export { QueryProvider };
