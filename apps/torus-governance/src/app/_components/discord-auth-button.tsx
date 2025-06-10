"use client";

import { Button } from "@torus-ts/ui/components/button";
import type { ButtonProps } from "@torus-ts/ui/components/button";
import { Icons } from "@torus-ts/ui/components/icons";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useDiscordAuth } from "../../../hooks/use-discord-auth";
import * as React from "react";

interface DiscordAuthButtonProps
  extends Omit<ButtonProps, "onClick" | "onError"> {
  onSignIn?: () => void | Promise<void>;
  onSignOut?: () => void | Promise<void>;
  onError?: (error: Error) => void;
  connectText?: string;
  disconnectText?: string;
  showIcon?: boolean;
  connectedClassName?: string;
  disconnectedClassName?: string;
}

export function DiscordAuthButton({
  onSignIn,
  onSignOut,
  onError,
  connectText = "Validate your Discord account",
  showIcon = true,
  className,
  connectedClassName = "flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
  disconnectedClassName = className ??
    "w-full bg-[#5865F2] text-white hover:bg-[#4752c4]",
  variant = "outline",
  disabled,
  children,
  ...buttonProps
}: DiscordAuthButtonProps) {
  const { isAuthenticated, isLoading, signIn, signOut, discordId } =
    useDiscordAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (isAuthenticated) {
      const [callbackError] = await tryAsync(Promise.resolve(onSignOut));
      if (callbackError) {
        onError?.(callbackError);
        return;
      }

      const signOutError = await signOut();
      if (signOutError) {
        onError?.(signOutError);
      }
    } else {
      const [callbackError] = await tryAsync(Promise.resolve(onSignIn));
      if (callbackError) {
        onError?.(callbackError);
        return;
      }

      const signInError = await signIn();
      if (signInError) {
        onError?.(signInError);
      }
    }
  };

  if (isLoading) {
    return (
      <Button
        {...buttonProps}
        disabled
        variant={variant}
        className={disconnectedClassName}
      >
        Loading...
      </Button>
    );
  }

  // When authenticated, show the Discord ID display with logout button
  if (isAuthenticated && discordId) {
    return (
      <div className={connectedClassName}>
        <div className="flex items-center gap-2">
          <Icons.Discord className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Discord ID:</span>
          <span className="font-mono">{discordId}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={async (e) => {
            e.preventDefault();
            const [callbackError] = await tryAsync(Promise.resolve(onSignOut));
            if (callbackError) {
              onError?.(callbackError);
              return;
            }
            const signOutError = await signOut();
            if (signOutError) {
              onError?.(signOutError);
            }
          }}
          className="h-7 px-2 text-xs"
        >
          Logout
        </Button>
      </div>
    );
  }

  // When not authenticated, show the connect button
  return (
    <Button
      {...buttonProps}
      type="button"
      variant={variant}
      className={disconnectedClassName}
      onClick={handleClick}
      disabled={disabled}
    >
      {children ?? (
        <>
          {showIcon && <Icons.Discord className="h-5 w-5 md:h-4 md:w-4" />}
          {connectText}
        </>
      )}
    </Button>
  );
}
