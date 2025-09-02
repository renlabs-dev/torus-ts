"use client";

import { useEffect, useState } from "react";

import { DestructiveAlertWithDescription } from "./destructive-alert-with-description";

interface WalletConnectionWarningProps {
  isAccountConnected: boolean;
  isInitialized?: boolean;
}

export function WalletConnectionWarning({
  isAccountConnected,
  isInitialized = true,
}: WalletConnectionWarningProps) {
  const [showDelayedWarning, setShowDelayedWarning] = useState(false);

  const shouldShowWarning = isInitialized && !isAccountConnected;

  useEffect(() => {
    if (!shouldShowWarning) {
      const resetTimer = setTimeout(() => {
        setShowDelayedWarning(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(() => {
      setShowDelayedWarning(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [shouldShowWarning]);

  if (!shouldShowWarning || !showDelayedWarning) {
    return null;
  }

  return (
    <DestructiveAlertWithDescription
      title="Wallet Required!"
      description="Please connect a wallet to proceed."
    />
  );
}
