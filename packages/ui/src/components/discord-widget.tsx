import * as React from "react";
import { cn } from "../lib/utils";
import { tryAsync } from "../../../utils/src/try-catch";

const serverId = "941362322000203776";
const uri = `https://discord.com/api/guilds/${serverId}/widget.json`;

async function getDiscordWidgetData(): Promise<unknown> {
  const [fetchError, res] = await tryAsync(fetch(uri));

  if (fetchError !== undefined) {
    console.error(`Failed to fetch Discord widget: ${fetchError.message}`);
    return null;
  }

  const [parseError, data] = await tryAsync(res.json());

  if (parseError !== undefined) {
    console.error(`Failed to parse Discord widget data: ${parseError.message}`);
    return null;
  }

  return data;
}

async function getPresenceCount(): Promise<number> {
  let presenceCount = 0;

  const [error, data] = await tryAsync(getDiscordWidgetData());

  if (error !== undefined) {
    console.error(`Failed to get Discord widget data: ${error.message}`);
    return presenceCount;
  }

  if (data && typeof data === "object" && "presenceCount" in data) {
    presenceCount = (data as { presenceCount: number }).presenceCount;
  }

  return presenceCount;
}

// Usage example
const [presenceError, presenceCount] = await tryAsync(getPresenceCount());
if (presenceError !== undefined) {
  console.error(`Failed to get presence count: ${presenceError.message}`);
}

export function handleDescription(description: string | null) {
  if (!presenceCount && !description) return <p>loading...</p>;
  if (!description) {
    return (
      <div className={cn("flex items-center gap-1")}>
        <span className={cn("h-2 w-2 rounded-2xl bg-green-400")} />
        <p>{presenceCount} Online (Discord)</p>
      </div>
    );
  }
  return <p>{description}</p>;
}
