import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { BasicLogger } from "./logger";
import { validateEnvOrExit } from "./env";
import { z } from "zod";

const log = BasicLogger.create({ name: "discord-role-management" });

const getEnv = validateEnvOrExit({
  DISCORD_BOT_SECRET: z.string().min(1),
  NEXT_PUBLIC_TORUS_CHAIN_ENV: z.string().min(1),
});

const env = getEnv(process.env);
const DISCORD_BOT_SECRET = env.DISCORD_BOT_SECRET;
const NEXT_PUBLIC_TORUS_CHAIN_ENV = env.NEXT_PUBLIC_TORUS_CHAIN_ENV;

// Discord Information
const serverId = "1306654856286699590";
const daoRoleId = "1306686252560420905";

/**
 * Modifies a Discord user's role (add or remove)
 * @param discordUserId Discord user ID
 * @param action "add" or "remove" the role
 * @returns true if successful, false otherwise
 */
async function modifyUserRole(
  discordUserId: string | undefined,
  action: "add" | "remove",
): Promise<boolean> {
  // Skip in testnet environment
  if (NEXT_PUBLIC_TORUS_CHAIN_ENV === "testnet") return false;

  // Validate user ID
  if (!discordUserId) {
    log.error("Discord user ID not provided");
    return false;
  }

  // Set up variables based on action
  const method = action === "add" ? "PUT" : "DELETE";
  const actionVerb = action === "add" ? "assign" : "remove";
  const actionPastTense = action === "add" ? "added" : "removed";

  log.info(`Attempting to ${actionVerb} DAO role to user ${discordUserId}`);

  const url = `https://discord.com/api/v10/guilds/${serverId}/members/${discordUserId}/roles/${daoRoleId}`;
  const [fetchError, response] = await tryAsync(
    fetch(url, {
      method: method,
      headers: {
        Authorization: `Bot ${DISCORD_BOT_SECRET}`,
        "Content-Type": "application/json",
      },
    }),
  );

  // Handle fetch errors
  if (fetchError !== undefined) {
    log.error(`Error ${actionVerb}ing role for user: ${fetchError}`);
    return false;
  }

  // Success case
  if (response.status === 204) {
    log.info(
      `Successfully ${actionPastTense} DAO role ${actionVerb === "assign" ? "to" : "from"} user ${discordUserId}`,
    );
    return true;
  }

  // Error cases
  log.error(
    `Failed to ${actionVerb} role for user. Status: ${response.status}`,
  );

  // Get detailed error message
  const [textError, errorData] = await tryAsync(response.text());
  if (textError !== undefined) {
    log.error("Could not parse error response");
  } else {
    log.error(`Discord API error: ${errorData}`);
  }

  return false;
}

/**
 * Assigns the DAO role to a Discord user
 * @param discordUserId Discord user ID
 * @returns true if successful, false otherwise
 */
export async function assignDAORole(
  discordUserId: string | undefined,
): Promise<boolean> {
  return modifyUserRole(discordUserId, "add");
}

/**
 * Removes the DAO role from a Discord user
 * @param discordUserId Discord user ID
 * @returns true if successful, false otherwise
 */
export async function removeDAORole(
  discordUserId: string | undefined,
): Promise<boolean> {
  return modifyUserRole(discordUserId, "remove");
}
