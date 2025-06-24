import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { chainErr } from "@torus-network/torus-utils/error";

const log = BasicLogger.create({ name: "discord-role-management" });

/**
 * Modifies a Discord user's role (add or remove).
 *
 * @param discordSecret - Discord bot secret token
 * @param serverId - Discord server ID
 * @param roleId - Discord role ID
 * @param discordUserId - Discord user ID
 * @param action - "add" or "remove" the role
 */
async function modifyUserRole(
  discordSecret: string,
  serverId: string,
  roleId: string,
  discordUserId: string,
  action: "add" | "remove",
): Promise<Result<null, Error>> {
  const method = action === "add" ? "PUT" : "DELETE";
  const actionVerb = action === "add" ? "assign" : "remove";
  const actionPastTense = action === "add" ? "added" : "removed";

  log.info(`Attempting to ${actionVerb} DAO role to user ${discordUserId}`);

  const url = `https://discord.com/api/v10/guilds/${serverId}/members/${discordUserId}/roles/${roleId}`;
  const [fetchErr, response] = await tryAsync(
    fetch(url, {
      method: method,
      headers: {
        Authorization: `Bot ${discordSecret}`,
        "Content-Type": "application/json",
      },
    }),
  );
  if (fetchErr !== undefined)
    return makeErr(chainErr(`Error ${actionVerb}ing role for user`)(fetchErr));

  // Success case
  if (response.status === 204) {
    log.info(
      `Successfully ${actionPastTense} DAO role ${actionVerb === "assign" ? "to" : "from"} user ${discordUserId}`,
    );
    return makeOk(null);
  }

  // Error cases
  log.error(
    `Failed to ${actionVerb} role for user, status: ${response.status}`,
  );

  // Get detailed error message
  const [textErr, errorData] = await tryAsync(response.text());
  if (textErr !== undefined) {
    return makeErr(chainErr("Discord API error")(textErr));
  } else {
    return makeErr(new Error(errorData));
  }
}

/**
 * Manages Discord role assignments for DAO members.
 *
 * Stores configuration and provides methods to assign and remove DAO roles
 * for Discord users in a specific server environment.
 */
export class DiscordRoleManager {
  constructor(
    private readonly discordSecret: string,
    private readonly serverId: string,
    private readonly daoRoleId: string,
  ) {}

  /**
   * Creates a DiscordRoleManager instance with the specified configuration.
   * @param discordSecret The Discord bot secret token
   * @param serverId Discord server ID
   * @param daoRoleId Discord DAO role ID
   */
  static create(
    discordSecret: string,
    serverId: string,
    daoRoleId: string,
  ): DiscordRoleManager {
    return new DiscordRoleManager(discordSecret, serverId, daoRoleId);
  }

  /**
   * Assigns the DAO role to a Discord user.
   * @param discordUserId - Discord user ID
   */
  async assignRole(discordUserId: string): Promise<Result<null, Error>> {
    return modifyUserRole(
      this.discordSecret,
      this.serverId,
      this.daoRoleId,
      discordUserId,
      "add",
    );
  }

  /**
   * Removes the DAO role from a Discord user.
   * @param discordUserId - Discord user ID
   */
  async removeRole(discordUserId: string): Promise<Result<null, Error>> {
    return modifyUserRole(
      this.discordSecret,
      this.serverId,
      this.daoRoleId,
      discordUserId,
      "remove",
    );
  }
}
