"use client";

import { useEffect, useState } from "react";

import {
  DestructiveAlertWithDescription,
} from "./destructive-alert-with-description";

interface WalletConnectionWarningProps {
  isAccountConnected: boolean;
  isInitialized?: boolean;
}

export function WalletConnectionWarning({
  isAccountConnected,
  isInitialized = true,
}: WalletConnectionWarningProps) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isInitialized || isAccountConnected) {
      setShowWarning(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowWarning(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isInitialized, isAccountConnected]);

  if (!showWarning) {
    return null;
  }

  return (
    <DestructiveAlertWithDescription
      title="Wallet Required!"
      description="Please connect a wallet to proceed."
    />
  );
}
