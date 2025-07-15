import {
  DestructiveAlertWithDescription,
} from "@torus-ts/ui/components/destructive-alert-with-description";
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
      <DestructiveAlertWithDescription
        title="Agent emissions required!"
        description="You need to be a agent with emissions to create demand signals. Please register as an agent first to access this feature."
      />
    );
  }

  if (isInitialized) {
    return <WalletConnectionWarning isAccountConnected={isAccountConnected} />;
  }

  return null;
}
