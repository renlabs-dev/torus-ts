import type { ApiPromise } from "@polkadot/api";
import type { SS58Address } from "@torus-network/sdk/types";
import { connectToChainRpc } from "@torus-network/sdk/utils";
import { createHashSigner } from "@torus-ts/api/auth/sign";
import { PermissionCacheService } from "@torus-ts/api/services/permission-cache";
import { createDb } from "@torus-ts/db/client";
import type { Env } from "./env";

export interface AppContext {
  db: ReturnType<typeof createDb>;
  wsAPI: Promise<ApiPromise>;
  permissionCache: PermissionCacheService;
  serverSignHash: (hash: string) => string;
  env: Env;
}

export interface AuthenticatedContext extends AppContext {
  userKey: SS58Address;
}

let globalDb: ReturnType<typeof createDb> | null = null;
let globalWsApi: Promise<ApiPromise> | null = null;
let globalPermissionCache: PermissionCacheService | null = null;
let globalServerHashSigner: ((hash: string) => string) | null = null;

export async function createAppContext(env: Env): Promise<AppContext> {
  if (globalDb === null) {
    globalDb = createDb();
  }

  if (globalWsApi === null) {
    globalWsApi = connectToChainRpc(env.NEXT_PUBLIC_TORUS_RPC_URL);
  }

  if (globalPermissionCache === null) {
    globalPermissionCache = new PermissionCacheService(
      globalWsApi,
      env.PERMISSION_GRANTOR_ADDRESS,
      env.PERMISSION_CACHE_REFRESH_INTERVAL_MS,
    );
    await globalPermissionCache.initialize();
  }

  if (globalServerHashSigner === null) {
    globalServerHashSigner = await createHashSigner(env.PREDICTION_APP_MNEMONIC);
  }

  return {
    db: globalDb,
    wsAPI: globalWsApi,
    permissionCache: globalPermissionCache,
    serverSignHash: globalServerHashSigner,
    env,
  };
}
