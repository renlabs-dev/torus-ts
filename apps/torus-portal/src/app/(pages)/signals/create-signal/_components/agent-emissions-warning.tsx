import { Ban } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@torus-ts/ui/components/alert";
import {
  WalletConnectionWarning,
} from "@torus-ts/ui/components/wallet-connection-warning";

interface AgentEmissionsWarningProps {
  hasAgentKey: boolean;
  isLoading: boolean;
  isAccountConnected: boolean;
  isInitialized: boolean;
}

export function AgentEmissionsWarning({
  hasAgentKey,
  isLoading,
  isAccountConnected,
  isInitialized,
}: AgentEmissionsWarningProps) {
  if (!hasAgentKey && !isLoading && isAccountConnected) {
    return (
      <Alert variant="destructive" className="animate-fade">
        <Ban className="h-4 w-4" />
        <AlertTitle>Agent emissions required!</AlertTitle>
        <AlertDescription>
          You need to be a root agent with emissions to create demand
          signals. Please register and whitelist as an agent first to access
          this feature.
        </AlertDescription>
      </Alert>
    );
  }

  if (isInitialized) {
    return <WalletConnectionWarning isAccountConnected={isAccountConnected} />;
  }

  return null;
}