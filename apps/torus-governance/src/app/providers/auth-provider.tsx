"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

<<<<<<< HEAD
export default function DiscordAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
=======
export default function AuthProvider({ children }: { children: ReactNode }) {
>>>>>>> 701128fe (add discord login button)
  return <SessionProvider>{children}</SessionProvider>;
}
