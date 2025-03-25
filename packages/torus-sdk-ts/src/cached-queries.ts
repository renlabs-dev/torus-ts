import SuperJSON from "superjson";
import { z } from "zod";

export const STAKE_DATA_SCHEMA = z.object({
  total: z.bigint(),
  perAddr: z.record(z.string(), z.bigint()),
  atBlock: z.bigint(),
  atTime: z.coerce.date(),
});

export type StakeData = z.infer<typeof STAKE_DATA_SCHEMA>;

export async function queryCachedStakeOut(
  torusCacheUrl: string,
): Promise<StakeData> {
  const response = await fetch(`${torusCacheUrl}/api/stake-out`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  const responseData = await response.text();
  const parsedData = SuperJSON.parse(responseData);

  return STAKE_DATA_SCHEMA.parse(parsedData);
}

export async function queryCachedStakeFrom(
  torusCacheUrl: string,
): Promise<StakeData> {
  const response = await fetch(`${torusCacheUrl}/api/stake-from`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  const responseData = await response.text();
  const parsedData = SuperJSON.parse(responseData);

  return STAKE_DATA_SCHEMA.parse(parsedData);
}
