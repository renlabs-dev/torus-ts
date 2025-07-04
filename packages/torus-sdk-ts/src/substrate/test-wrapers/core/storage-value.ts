import type { ApiPromise } from "@polkadot/api";
import type { z } from "zod";

import { isErr } from "@torus-network/torus-utils/result";

import { SbStorageValue } from "../../storage.js";

export function createStorageValue<Schema extends z.ZodTypeAny>(
  pallet: string,
  storage: string,
  schema: Schema
) {
  const storageWrapper = new SbStorageValue(pallet, storage, schema);
  
  return {
    query: (api: ApiPromise) => ({
      get: async (): Promise<z.output<Schema>> => {
        const result = await storageWrapper.query(api)();
        if (isErr(result)) {
          throw new Error(`Failed to query ${pallet}.${storage}: ${result[0].message}`);
        }
        // Return the properly validated and parsed data from the storage wrapper
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result[1];
      },
      
      subscribe: (callback: (value: z.output<Schema>) => void) => {
        const entry = storageWrapper.storageEntryOn(api);
        return entry((raw: never) => {
          const parsed = schema.safeParse(raw);
          if (parsed.success) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            callback(parsed.data);
          }
        });
      },
      
      at: async (blockHash: string): Promise<z.output<Schema>> => {
        const entry = storageWrapper.storageEntryOn(api);
        const raw = await entry.at(blockHash);
        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
          throw new Error(`Failed to parse ${pallet}.${storage}: ${parsed.error.message}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return parsed.data;
      }
    })
  };
}
