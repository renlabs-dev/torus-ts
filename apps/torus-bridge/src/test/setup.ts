// Mock @hyperlane-xyz/sdk FIRST before any other imports
vi.mock('@hyperlane-xyz/sdk', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ExplorerFamily: {
      Blockscout: 'blockscout',
      Etherscan: 'etherscan',
    },
  };
});

import "@torus-ts/vitest-config/setup";
import { vi } from "vitest";
import {createElement} from "react";
import { configure } from "@testing-library/react";

// Create a shim for the vanilla-extract CommonJS module
const mockCreateMapValueFn = vi.fn(() => ({}));
Object.defineProperty(globalThis, 'createMapValueFn', {
  value: mockCreateMapValueFn,
  writable: true,
});

// Try to mock the module at the global level
try {
  require.cache[require.resolve('@vanilla-extract/sprinkles/createUtils')] = {
    exports: {
      default: { createMapValueFn: mockCreateMapValueFn },
      createMapValueFn: mockCreateMapValueFn,
    }
  };
} catch (e) {
  // Ignore if module not found
}

configure({
  getElementError: (message, _container) => {
    const error = new Error(message ?? "");
    error.name = "TestingLibraryElementError";
    error.stack = error.stack?.split("\n").slice(0, 10).join("\n");
    return error;
  },
});

vi.mock("~/config", () => ({
  getChainValuesOnEnv: () => () => ({ chainId: 8453 }),
  contractAddresses: {
    base: {
      mainnet: { torusErc20: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867" },
      testnet: { torusErc20: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867" },
    },
  },
}));

vi.mock("~/env", () => ({
  env: (key: string) => {
    if (key === "NEXT_PUBLIC_TORUS_CHAIN_ENV") return "testnet";
    if (key === "NEXT_PUBLIC_CHAIN_WALLET_WHITELISTS") return "{}";
    return "";
  },
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: () => createElement('div', { 'data-testid': 'alert-circle-icon' }),
  AlertTriangle: () => createElement('div', { 'data-testid': 'alert-icon' }),
  ArrowRight: () => createElement('div', { 'data-testid': 'arrow-right' }),
  ArrowLeftRight: () => createElement('div', { 'data-testid': 'arrow-left-right-icon' }),
  Check: () => createElement('div', { 'data-testid': 'check-icon' }),
  CheckCircle: () => createElement('div', { 'data-testid': 'check-circle-icon' }),
  CheckCircle2: () => createElement('div', { 'data-testid': 'check-circle-icon' }),
  CheckSquare: () => createElement('div', { 'data-testid': 'check-square-icon' }),
  ChevronDown: () => createElement('div', { 'data-testid': 'chevron-down' }),
  ChevronUp: () => createElement('div', { 'data-testid': 'chevron-up' }),
  Clock: () => createElement('div', { 'data-testid': 'clock-icon' }),
  ExternalLink: () => createElement('div', { 'data-testid': 'external-link' }),
  History: () => createElement('div', { 'data-testid': 'history-icon' }),
  Info: () => createElement('div', { 'data-testid': 'info-icon' }),
  Loader2: () => createElement('div', { 'data-testid': 'loader-icon' }),
  Play: () => createElement('div', { 'data-testid': 'play-icon' }),
  RotateCw: () => createElement('div', { 'data-testid': 'rotate-icon' }),
  Square: () => createElement('div', { 'data-testid': 'square-icon' }),
  Trash: () => createElement('div', { 'data-testid': 'trash-icon' }),
  Trash2: () => createElement('div', { 'data-testid': 'trash-icon' }),
  Wallet: () => createElement('div', { 'data-testid': 'wallet-icon' }),
  Zap: () => createElement('div', { 'data-testid': 'zap-icon' }),
}));

vi.mock("@torus-ts/query-provider/hooks", () => ({
  useFreeBalance: () => ({
    data: 1000n * 10n ** 18n,
    refetch: vi.fn().mockResolvedValue({ status: "success", data: 1000n * 10n ** 18n }),
  }),
  useGetTorusPrice: () => ({ data: 1.0 }),
}));

vi.mock("@torus-ts/torus-provider", () => ({
  useTorus: () => ({
    selectedAccount: { address: "1ABC..." },
    api: {},
    torusApi: {},
    wsEndpoint: "wss://test",
  }),
}));

vi.mock("@torus-ts/ui/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("~/hooks/token", () => ({
  useWarpCore: () => ({}),
}));

vi.mock("~/hooks/use-multi-provider", () => ({
  useMultiProvider: () => ({}),
}));

vi.mock("~/hooks/use-token-transfer", () => ({
  useTokenTransfer: () => ({
    triggerTransactions: vi.fn().mockResolvedValue("0xtxhash"),
  }),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x123...",
    chain: { id: 8453 },
  }),
  useBalance: () => ({
    data: { value: 5n * 10n ** 18n },
    refetch: vi.fn().mockResolvedValue({ status: "success", data: { value: 5n * 10n ** 18n } }),
  }),
  useClient: () => ({}),
  useConfig: () => ({}),
  useReadContract: () => ({
    data: 10n * 10n ** 18n,
    refetch: vi.fn().mockResolvedValue({ status: "success", data: 10n * 10n ** 18n }),
  }),
  useSwitchChain: () => ({
    switchChainAsync: vi.fn(),
  }),
  useWalletClient: () => ({
    data: {},
  }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    createElement('img', { src, alt, 'data-testid': `image-${alt}` })
  ),
}));


