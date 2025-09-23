import { SimpleBridgeForm } from "./simple-bridge-form";

export function SimpleBridge() {
  return <SimpleBridgeForm />;
}

export { SimpleBridgeForm } from "./simple-bridge-form";
export { DualWalletConnector } from "./dual-wallet-connector";
export * from "./simple-bridge-types";
export * from "./hooks/use-dual-wallet";
export * from "./hooks/use-orchestrated-transfer";
