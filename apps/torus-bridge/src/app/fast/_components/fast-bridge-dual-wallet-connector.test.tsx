import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDualWallet } from "../hooks/use-fast-bridge-dual-wallet";
import { DualWalletConnector } from "./fast-bridge-dual-wallet-connector";

// Mock the hook
vi.mock("../hooks/use-fast-bridge-dual-wallet");

const mockUseDualWallet = vi.mocked(useDualWallet);

describe("DualWalletConnector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockHookReturn = (overrides: any = {}) => ({
    connectionState: {
      torusWallet: {
        isConnected: false,
        address: undefined,
        isConnecting: false,
      },
      evmWallet: {
        isConnected: false,
        address: undefined,
        chainId: undefined,
        isConnecting: false,
      },
    },
    areWalletsReady: vi.fn(() => false),
    getConnectionStatus: vi.fn(() => "disconnected"),
    isRequiredChainConnected: vi.fn(() => false),
    isOnOptimalChain: vi.fn(() => false),
    getRequiredChainId: vi.fn(() => 8453),
    chainIds: {
      base: 8453,
      torusEvm: 42,
    },
    ...overrides,
  });

  describe("rendering", () => {
    it("should render the component title with wallet icon", () => {
      mockUseDualWallet.mockReturnValue(createMockHookReturn());
      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("wallet-connector-title")).toHaveTextContent("Connect Wallets");
    });

    it("should render direction description for base-to-native", () => {
      mockUseDualWallet.mockReturnValue(createMockHookReturn());
      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("direction-description")).toHaveTextContent("Transfer Base TORUS → Torus");
    });

    it("should render direction description for native-to-base", () => {
      mockUseDualWallet.mockReturnValue(createMockHookReturn());
      render(<DualWalletConnector direction="native-to-base" />);

      expect(screen.getByTestId("direction-description")).toHaveTextContent("Transfer Torus → Base TORUS");
    });
  });

  describe("connection states - both disconnected", () => {
    it("should show both wallets as not connected", () => {
      mockUseDualWallet.mockReturnValue(createMockHookReturn());
      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("torus-wallet-name")).toHaveTextContent("Torus Wallet");
      expect(screen.getByTestId("torus-wallet-status")).toHaveTextContent("Not connected");
      expect(screen.getByTestId("evm-wallet-status")).toHaveTextContent("Not connected");
    });

    it("should display connecting status message when both disconnected", () => {
      mockUseDualWallet.mockReturnValue(createMockHookReturn());
      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("connection-status-message")).toHaveTextContent("Connect both wallets to continue");
    });

    it("should show pulsing animation indicator when not connected", () => {
      mockUseDualWallet.mockReturnValue(createMockHookReturn());
      const { container } = render(
        <DualWalletConnector direction="base-to-native" />
      );

      // Check for animated pulse element
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe("connection states - both connected", () => {
    it("should show both wallets as connected with addresses", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: true,
              address: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" as any,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: true,
              address: "0x1234567890abcdef1234567890abcdef12345678",
              chainId: 8453,
              isConnecting: false,
            },
          },
          areWalletsReady: vi.fn(() => true),
          getConnectionStatus: vi.fn(() => "connected"),
        })
      );

      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("torus-wallet-name")).toHaveTextContent("Torus Wallet");
      expect(screen.getByTestId("evm-wallet-name")).toHaveTextContent("Base Wallet");

      // Check for "Connected:" prefix in both wallet status texts
      const torusConnectedText = screen.getByTestId("torus-wallet-status");
      const evmConnectedText = screen.getByTestId("evm-wallet-status");
      expect(torusConnectedText).toHaveTextContent(/Connected:/);
      expect(evmConnectedText).toHaveTextContent(/Connected:/);
    });

    it("should display ready message when both wallets are ready", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: true,
              address: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" as any,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: true,
              address: "0x1234567890abcdef1234567890abcdef12345678",
              chainId: 8453,
              isConnecting: false,
            },
          },
          areWalletsReady: vi.fn(() => true),
          getConnectionStatus: vi.fn(() => "connected"),
        })
      );

      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("ready-status")).toHaveTextContent("Ready to proceed with transfer");
    });

    it("should show green check circle icons when both connected", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: true,
              address: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" as any,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: true,
              address: "0x1234567890abcdef1234567890abcdef12345678",
              chainId: 8453,
              isConnecting: false,
            },
          },
          areWalletsReady: vi.fn(() => true),
          getConnectionStatus: vi.fn(() => "connected"),
        })
      );

      const { container } = render(
        <DualWalletConnector direction="base-to-native" />
      );

      // Check for green text color (text-green-500 or text-green-600)
      const greenElements = container.querySelectorAll(".text-green-500, .text-green-600");
      expect(greenElements.length).toBeGreaterThan(0);
    });
  });

  describe("connection states - partially connected", () => {
    it("should show Torus connected and EVM disconnected", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: true,
              address: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" as any,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: false,
              address: undefined,
              chainId: undefined,
              isConnecting: false,
            },
          },
          areWalletsReady: vi.fn(() => false),
          getConnectionStatus: vi.fn(() => "partially_connected"),
        })
      );

      render(<DualWalletConnector direction="base-to-native" />);

      const connectedText = screen.getByTestId("torus-wallet-status");
      expect(connectedText).toBeInTheDocument();

      expect(screen.getByTestId("evm-wallet-status")).toHaveTextContent("Not connected");
    });

    it("should display partial connection message", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: true,
              address: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" as any,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: false,
              address: undefined,
              chainId: undefined,
              isConnecting: false,
            },
          },
          areWalletsReady: vi.fn(() => false),
          getConnectionStatus: vi.fn(() => "partially_connected"),
        })
      );

      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("connection-status-message")).toHaveTextContent("Connect remaining wallet to continue");
    });
  });

  describe("connection states - connecting", () => {
    it("should show connecting state with animation", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: false,
              address: undefined,
              isConnecting: true,
            },
            evmWallet: {
              isConnected: false,
              address: undefined,
              chainId: undefined,
              isConnecting: true,
            },
          },
          areWalletsReady: vi.fn(() => false),
          getConnectionStatus: vi.fn(() => "connecting"),
        })
      );

      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("connection-status-message")).toHaveTextContent("Connecting wallets...");
    });
  });

  describe("EVM chain names", () => {
    it("should display Base Wallet when connected to Base chain", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: false,
              address: undefined,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: true,
              address: "0x1234567890abcdef1234567890abcdef12345678",
              chainId: 8453, // Base chain ID
              isConnecting: false,
            },
          },
          chainIds: {
            base: 8453,
            torusEvm: 42,
          },
        })
      );

      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("evm-wallet-name")).toHaveTextContent("Base Wallet");
    });

    it("should display Torus EVM Wallet when connected to Torus EVM chain", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: false,
              address: undefined,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: true,
              address: "0x1234567890abcdef1234567890abcdef12345678",
              chainId: 42, // Torus EVM chain ID
              isConnecting: false,
            },
          },
          chainIds: {
            base: 8453,
            torusEvm: 42,
          },
        })
      );

      render(<DualWalletConnector direction="native-to-base" />);

      expect(screen.getByTestId("evm-wallet-name")).toHaveTextContent("Torus EVM Wallet");
    });

    it("should display Unknown Wallet when connected to unknown chain", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: false,
              address: undefined,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: true,
              address: "0x1234567890abcdef1234567890abcdef12345678",
              chainId: 999999, // Unknown chain
              isConnecting: false,
            },
          },
          chainIds: {
            base: 8453,
            torusEvm: 42,
          },
        })
      );

      render(<DualWalletConnector direction="base-to-native" />);

      expect(screen.getByTestId("evm-wallet-name")).toHaveTextContent("Unknown Wallet");
    });
  });

  describe("visual indicators", () => {
    it("should show green status indicator when wallet connected", () => {
      mockUseDualWallet.mockReturnValue(
        createMockHookReturn({
          connectionState: {
            torusWallet: {
              isConnected: true,
              address: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" as any,
              isConnecting: false,
            },
            evmWallet: {
              isConnected: false,
              address: undefined,
              chainId: undefined,
              isConnecting: false,
            },
          },
        })
      );

      const { container } = render(
        <DualWalletConnector direction="base-to-native" />
      );

      const greenIndicators = container.querySelectorAll(".bg-green-500");
      expect(greenIndicators.length).toBeGreaterThan(0);
    });

    it("should show gray status indicator when wallet disconnected", () => {
      mockUseDualWallet.mockReturnValue(createMockHookReturn());
      const { container } = render(
        <DualWalletConnector direction="base-to-native" />
      );

      const grayIndicators = container.querySelectorAll(".bg-gray-300");
      expect(grayIndicators.length).toBeGreaterThan(0);
    });
  });
});
