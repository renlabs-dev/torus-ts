import SuperJSON from "superjson";
import { z } from "zod";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

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
  const [fetchError, response] = await tryAsync(
    fetch(`${torusCacheUrl}/api/stake-out`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  if (fetchError !== undefined) {
    console.error("Error fetching cached stake out data:", fetchError);
    throw fetchError;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stake-out data: ${response.status} ${response.statusText}`,
    );
  }

  const [textError, responseData] = await tryAsync(response.text());
  if (textError !== undefined) {
    console.error("Error extracting response text for stake out:", textError);
    throw textError;
  }

  const [parseJsonError, parsedData] = trySync(() =>
    SuperJSON.parse(responseData),
  );
  if (parseJsonError !== undefined) {
    console.error("Error parsing stake out JSON data:", parseJsonError);
    throw parseJsonError;
  }

  const [parseSchemaError, result] = trySync(() =>
    STAKE_DATA_SCHEMA.parse(parsedData),
  );
  if (parseSchemaError !== undefined) {
    console.error("Error validating stake out data schema:", parseSchemaError);
    throw parseSchemaError;
  }

  return result;
}

export async function queryCachedStakeFrom(
  torusCacheUrl: string,
): Promise<StakeData> {
  const [fetchError, response] = await tryAsync(
    fetch(`${torusCacheUrl}/api/stake-from`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  if (fetchError !== undefined) {
    console.error("Error fetching cached stake from data:", fetchError);
    throw fetchError;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stake-from data: ${response.status} ${response.statusText}`,
    );
  }

  const [textError, responseData] = await tryAsync(response.text());
  if (textError !== undefined) {
    console.error("Error extracting response text for stake from:", textError);
    throw textError;
  }

  const [parseJsonError, parsedData] = trySync(() =>
    SuperJSON.parse(responseData),
  );
  if (parseJsonError !== undefined) {
    console.error("Error parsing stake from JSON data:", parseJsonError);
    throw parseJsonError;
  }

  const [parseSchemaError, result] = trySync(() =>
    STAKE_DATA_SCHEMA.parse(parsedData),
  );
  if (parseSchemaError !== undefined) {
    console.error("Error validating stake from data schema:", parseSchemaError);
    throw parseSchemaError;
  }

  return result;
}
