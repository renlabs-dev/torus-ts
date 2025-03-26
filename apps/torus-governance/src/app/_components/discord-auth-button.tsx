"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Icons } from "@torus-ts/ui/components/icons";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

interface DiscordLoginProps {
  onAuthChange?: (
    discordId: string | null,
    userName: string | null,
    avatarUrl: string | null,
  ) => void;
  onButtonClick?: () => void;
}

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  discordId?: string;
}

export default function DiscordLogin({
  onAuthChange,
  onButtonClick,
}: DiscordLoginProps) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const user = session?.user as ExtendedUser | undefined;
  const discordId = user?.discordId;
  const userName = user?.name;
  const avatarUrl = user?.image;

  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(discordId ?? null, userName ?? null, avatarUrl ?? null);
    }
  }, [discordId, userName, avatarUrl, onAuthChange]);

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();

    onButtonClick?.();
    try {
      await signIn("discord", { redirect: false });
    } catch (error) {
      console.error("Error signing in with Discord:", error);
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();

    onButtonClick?.();
    await signOut({ redirect: false });
  };

  if (isLoading) {
    return (
      <Button type="button" disabled>
        Loading...
      </Button>
    );
  }

  if (session && discordId) {
    return (
      <div className="flex items-center gap-3 bg-gray-600/20 p-3">
        {user.image && (
          <>
            <div className="flex flex-col">
              <span className="text-sm text-white">
                Connected as {user.name}
              </span>
              <span className="text-xs text-gray-400">ID: {discordId}</span>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="ml-auto"
              onClick={handleSignOut}
            >
              Disconnect
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full bg-[#5865F2] text-white hover:bg-[#4752c4]"
      onClick={handleSignIn}
    >
      <Icons.Discord className="h-5 w-5 md:h-4 md:w-4" /> Validate your Discord
      account
    </Button>
  );
}
