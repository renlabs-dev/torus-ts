"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@torus-ts/ui/components/alert";
import { Ban } from "lucide-react";

interface WalletConnectionWarningProps {
  formType?: string;
  isAccountConnected: boolean;
}

export function WalletConnectionWarning({
  formType,
  isAccountConnected,
}: WalletConnectionWarningProps) {
  if (isAccountConnected) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <Ban className="h-4 w-4" />
      <AlertTitle>Wallet Required!</AlertTitle>
      <AlertDescription>
        Please connect a wallet to {formType ?? "procede"}.
      </AlertDescription>
    </Alert>
  );
}
