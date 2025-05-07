import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { env } from "~/env";

const NEXT_PUBLIC_TORUS_CHAIN_ENV = env("NEXT_PUBLIC_TORUS_CHAIN_ENV");

const log = BasicLogger.create({ name: "cadre-candidate-form" });

export async function isUserInServer(discordUserId: string): Promise<boolean> {
  if (NEXT_PUBLIC_TORUS_CHAIN_ENV !== "mainnet") return true;
  log.info(`Checking if user ${discordUserId} is in Discord server`);

  // Make API request to our backend endpoint
  const [fetchError, response] = await tryAsync(
    fetch("/api/discord-verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ discordUserId }),
    }),
  );

  if (fetchError !== undefined) {
    log.error(`Error checking Discord membership: ${fetchError}`);
    return false;
  }

  // Parse the response
  const [jsonError, data] = await tryAsync(response.json());

  if (jsonError !== undefined) {
    log.error(`Error parsing Discord membership response: ${jsonError}`);
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (response.ok && data.isInServer) {
    log.info(`User ${discordUserId} is in Discord server`);
    return true;
  } else {
    log.info(`User ${discordUserId} is NOT in Discord server`);
    return false;
  }
}
