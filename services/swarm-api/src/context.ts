import type { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { queryAgents } from "@torus-network/sdk/chain";
import { checkSS58 } from "@torus-network/sdk/types";
import type { SS58Address } from "@torus-network/sdk/types";
import { connectToChainRpc } from "@torus-network/sdk/utils";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { createHashSigner } from "@torus-ts/api/auth/sign";
import { PermissionCacheService } from "@torus-ts/api/services/permission-cache";
import { createDb } from "@torus-ts/db/client";
import type { Env } from "./env";

export interface AppContext {
  db: ReturnType<typeof createDb>;
  wsAPI: Promise<ApiPromise>;
  permissionCache: PermissionCacheService;
  serverSignHash: (hash: string) => string;
  logger: ReturnType<typeof BasicLogger.create>;
  env: Env;
  appAgentName: string;
}

export interface AuthenticatedContext extends AppContext {
  userKey: SS58Address;
}

export async function createAppContext(env: Env): Promise<AppContext> {
  const logger = BasicLogger.create({ name: "swarm-api" });

  logger.info("Initializing application context...");

  const db = createDb();
  const wsAPI = connectToChainRpc(env.NEXT_PUBLIC_TORUS_RPC_URL);

  const serverSignHash = await createHashSigner(env.PREDICTION_APP_MNEMONIC);

  const keyring = new Keyring({ type: "sr25519" });
  const appAccount = keyring.addFromMnemonic(env.PREDICTION_APP_MNEMONIC);
  const appAddress = checkSS58(appAccount.address);

  const permissionCache = new PermissionCacheService(
    wsAPI,
    appAddress,
    env.PERMISSION_CACHE_REFRESH_INTERVAL_MS,
  );
  await permissionCache.initialize();
  const api = await wsAPI;
  const agents = await queryAgents(api);
  const appAgent = agents.get(appAddress);

  if (!appAgent) {
    throw new Error(
      `App agent not found on blockchain: ${appAccount.address}. Please register the agent first.`,
    );
  }

  logger.info(`Resolved app agent name: ${appAgent.name}`);

  return {
    db,
    wsAPI,
    permissionCache,
    serverSignHash,
    logger,
    env,
    appAgentName: appAgent.name,
  };
}
