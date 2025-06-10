import { NextResponse } from "next/server";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { env } from "~/env";

// "Torus" Discord server ID
const serverId = "1306654856286699590";

const log = BasicLogger.create({ name: "discord-api" });

export async function POST(request: Request) {
  const DISCORD_BOT_SECRET = env("DISCORD_BOT_SECRET");

  const [parseError, data] = await tryAsync(request.json());

  if (parseError !== undefined) {
    log.error("Error parsing request body:", parseError);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { discordUserId } = data;

  if (!discordUserId) {
    return NextResponse.json(
      { error: "Discord user ID required" },
      { status: 400 },
    );
  }

  const [fetchError, response] = await tryAsync(
    fetch(
      `https://discord.com/api/v10/guilds/${serverId}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_SECRET}`,
        },
      },
    ),
  );

  if (fetchError !== undefined) {
    log.error(`Error checking Discord membership: ${fetchError}`);
    return NextResponse.json(
      { error: "Failed to verify Discord membership", isInServer: false },
      { status: 500 },
    );
  }

  // Return the result
  return NextResponse.json({ isInServer: response.status === 200 });
}
