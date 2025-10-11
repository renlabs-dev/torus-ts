import { ApiPromise, WsProvider } from "@polkadot/api";
import { env } from "~/env";

// Types for Polkadot codec methods
export interface PolkadotCodec {
  isEmpty?: boolean;
  toHuman?: () => unknown;
}

class TorusApi {
  private static instance: TorusApi | null = null;
  private api: ApiPromise | null = null;
  private readonly nodeUrl: string;

  private constructor() {
    this.nodeUrl = env("NEXT_PUBLIC_TORUS_RPC_URL");
  }

  public static getInstance(): TorusApi {
    if (!TorusApi.instance) {
      TorusApi.instance = new TorusApi();
    }
    return TorusApi.instance;
  }

  public async connect(): Promise<ApiPromise> {
    if (this.api?.isConnected) {
      return this.api;
    }

    try {
      const wsProvider = new WsProvider(this.nodeUrl);
      this.api = await ApiPromise.create({ provider: wsProvider });

      if (!this.api.isConnected) {
        throw new Error("Failed to connect to Torus network");
      }

      return this.api;
    } catch (error) {
      console.error("Failed to connect to Torus network:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }

  public async getAgentData(address: string): Promise<PolkadotCodec> {
    const api = await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return api.query.torus0!.agents!(address);
  }

  public isConnected(): boolean {
    return this.api?.isConnected ?? false;
  }

  public getNodeUrl(): string {
    return this.nodeUrl;
  }
}

export const torusApi = TorusApi.getInstance();
