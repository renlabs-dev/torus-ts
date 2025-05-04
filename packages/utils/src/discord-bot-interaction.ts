import { Client, GatewayIntentBits } from "discord.js";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { BasicLogger } from "./logger";
import { validateEnvOrExit } from "./env";
import { z } from "zod";

const log = BasicLogger.create({ name: "discord-bot-interaction" });

// Initialize the Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const getEnv = validateEnvOrExit({
  DISCORD_BOT_TOKEN: z.string().min(1),
  NEXT_PUBLIC_TORUS_CHAIN_ENV: z.string().min(1),
});

const env = getEnv(process.env);
const DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN;
const NEXT_PUBLIC_TORUS_CHAIN_ENV = env.NEXT_PUBLIC_TORUS_CHAIN_ENV;

// Discord Information
const serverId = "1306654856286699590";
const roleName = "Curator DAO";

// Login to Discord with your app's token
await client.login(DISCORD_BOT_TOKEN);

// Function to assign a DAO role to a member
export async function assignDAORole(
  discordUserId: string | undefined,
): Promise<boolean> {
  // Get the guild (server)
  // For some reason discord calls the server as GUILD
  // Welcome to xXxToRuS_GuildxXx

  if (NEXT_PUBLIC_TORUS_CHAIN_ENV == "testnet") return false;
  const guild = client.guilds.cache.get(serverId);
  if (!guild) {
    log.error(`Server with ID ${serverId} not found`);
    return false;
  }

  if (!discordUserId) {
    log.error(`Discord user ID not found`);
    return false;
  }

  // Get the member (fetch to ensure we have the latest data)
  const memberResult = await tryAsync(guild.members.fetch(discordUserId));

  const memberErrorMsg = `Member with ID ${discordUserId} not found in guild ${serverId}`;
  if (log.ifResultIsErr(memberResult, memberErrorMsg)) return false;
  const member = memberResult[1];

  // Get the DAO role
  const daoRole = guild.roles.cache.find((role) => role.name === roleName);
  if (!daoRole) {
    log.error(`Role "${roleName}" not found in the server:  ${serverId}`);
    return false;
  }

  // Add the role to the member
  const roleResult = await tryAsync(member.roles.add(daoRole));
  const roleErrorMsg = `Error assigning ${roleName} role to user ${discordUserId}`;
  if (log.ifResultIsErr(roleResult, roleErrorMsg)) return false;

  log.info(`Successfully added ${roleName} role to user ${discordUserId}`);
  return true;
}

// Function to remove a DAO role from a member
export async function removeDAORole(
  discordUserId: string | undefined,
): Promise<boolean> {
  if (NEXT_PUBLIC_TORUS_CHAIN_ENV == "testnet") return false;

  const guild = client.guilds.cache.get(serverId);
  if (!guild) {
    log.error(`Server with ID ${serverId} not found`);
    return false;
  }
  if (!discordUserId) {
    log.error(`Discord user ID not found`);
    return false;
  }

  // Get the member
  const memberResult = await tryAsync(guild.members.fetch(discordUserId));
  const memberErrorMsg = `Member with ID ${discordUserId} not found in server ${serverId}`;
  if (log.ifResultIsErr(memberResult, memberErrorMsg)) return false;
  const member = memberResult[1];

  // Get the DAO role
  const daoRole = guild.roles.cache.find((role) => role.name === roleName);
  if (!daoRole) {
    log.error(`Role "${roleName}" not found in the server: ${serverId}`);
    return false;
  }

  // Remove the role from the member
  const roleResult = await tryAsync(member.roles.remove(daoRole));
  const roleErrorMsg = `Error removing ${roleName} role from user ${discordUserId}`;
  if (log.ifResultIsErr(roleResult, roleErrorMsg)) return false;

  log.info(`Successfully removed ${roleName} role from user ${discordUserId}`);
  return true;
}
