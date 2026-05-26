import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";
import { createElement } from "react";
import { vi } from "vitest";

configure({
  getElementError: (message, _container) => {
    const error = new Error(message ?? "");
    error.name = "TestingLibraryElementError";
    error.stack = error.stack?.split("\n").slice(0, 10).join("\n");
    return error;
  },
});

vi.mock("~/env", () => ({
  env: (key: string) => {
    const values: Record<string, string> = {
      NEXT_PUBLIC_WALLET_CONNECT_ID: "test-wc-id",
      NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS:
        "0x0000000000000000000000000000000000000001",
    };
    return values[key] ?? "";
  },
  EnvScript: () => createElement("script", {}),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useReadContract: () => ({ data: undefined, isLoading: false, error: null }),
  useWriteContract: () => ({
    writeContract: vi.fn(),
    data: undefined,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
  useWaitForTransactionReceipt: () => ({
    data: undefined,
    error: null,
    isLoading: false,
    isSuccess: false,
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
  usePublicClient: () => ({
    getCode: vi.fn().mockResolvedValue("0x"),
  }),
  WagmiProvider: ({ children }: { children: React.ReactNode }) =>
    createElement("div", {}, children),
  createConfig: vi.fn(() => ({})),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  RainbowKitProvider: ({ children }: { children: React.ReactNode }) =>
    createElement("div", {}, children),
  ConnectButton: () => createElement("button", {}, "Connect Wallet"),
  getDefaultConfig: vi.fn(() => ({})),
  midnightTheme: vi.fn(() => ({})),
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
    createElement("div", {}, children),
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: () =>
    createElement("div", { "data-testid": "icon-alert-circle" }),
  CheckCircle: () =>
    createElement("div", { "data-testid": "icon-check-circle" }),
  ExternalLink: () =>
    createElement("div", { "data-testid": "icon-external-link" }),
  Info: () => createElement("div", { "data-testid": "icon-info" }),
  Loader2: () => createElement("div", { "data-testid": "icon-loader" }),
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
