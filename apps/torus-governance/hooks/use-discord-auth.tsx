"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  discordId?: string;
}

function isExtendedUser(user: unknown): user is ExtendedUser {
  if (!user || typeof user !== "object") return false;
  return "discordId" in user;
}

export function useDiscordAuth() {
  const { data: session, status } = useSession();
  const user =
    session?.user && isExtendedUser(session.user) ? session.user : undefined;
  const signInWithDiscord = async () => {
    const [error] = await tryAsync(signIn("discord", { redirect: false }));
    if (error) {
      console.error("Error signing in with Discord:", error);
    }
    return error;
  };

  const signOutFromDiscord = async () => {
    const [error] = await tryAsync(signOut({ redirect: false }));
    if (error) {
      console.error("Error signing out from Discord:", error);
    }
    return error;
  };

  return {
    user,
    discordId: user?.discordId ?? null,
    userName: user?.name ?? null,
    avatarUrl: user?.image ?? null,
    isLoading: status === "loading",
    isAuthenticated: !!session && !!user?.discordId,
    signIn: signInWithDiscord,
    signOut: signOutFromDiscord,
  };
}
