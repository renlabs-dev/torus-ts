import { cn } from "../lib/utils";

const serverId = "941362322000203776";
const uri = `https://discord.com/api/guilds/${serverId}/widget.json`;

async function getDiscordWidgetData(): Promise<unknown> {
  try {
    const res = await fetch(uri);
    return res.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
}

let presenceCount = 0;
try {
  const data = await getDiscordWidgetData();
  if (data && typeof data === "object" && "presenceCount" in data) {
    presenceCount = (data as { presenceCount: number }).presenceCount;
  }
} catch (error) {
  console.error("Failed to fetch Discord widget data:", error);
}

export function handleDescription(description: string | null): JSX.Element {
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
