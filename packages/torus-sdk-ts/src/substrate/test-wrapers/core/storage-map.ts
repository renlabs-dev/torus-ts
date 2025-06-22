// storage/core/storage-map.ts
import type { ApiPromise } from '@polkadot/api';
import type { z } from 'zod';
import { SbStorageMap } from '../../storage';
import { trySync } from '@torus-network/torus-utils/try-catch';

export function createStorageMap<
  KeySchema extends z.ZodTypeAny,
  ValueSchema extends z.ZodTypeAny
>(
  pallet: string,
  storage: string,
  keySchema: KeySchema,
  valueSchema: ValueSchema
) {
  const storageWrapper = new SbStorageMap(pallet, storage, keySchema, valueSchema);
  
  return {
    query: (api: ApiPromise) => ({
      get: async (key: z.input<KeySchema>): Promise<z.output<ValueSchema> | null> => {
        const entry = storageWrapper.storageEntryOn(api);
        const rawValue = await entry(key);
        
        if (rawValue.isEmpty) {
          return null;
        }
        
        // Convert to JSON first, then validate
        const jsonValue = rawValue.toJSON();
        const parsed = valueSchema.safeParse(jsonValue, {
          path: ["storage", pallet, storage, String(key)],
        });
        
        if (!parsed.success) {
          throw new Error(`Failed to query ${pallet}.${storage}: ${parsed.error.message}`);
        }
        
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return parsed.data;
      },

      display: async (key: z.input<KeySchema>): Promise<unknown> => {
        const entry = storageWrapper.storageEntryOn(api);
        const raw = await entry(key);
        if (raw.isEmpty) {
          return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        const [parseError, humanReadable] = trySync(() => JSON.parse(raw.toString()));
        if (parseError) {
          return raw.toString();
        }
        return humanReadable;
      },
      
      entries: async (): Promise<[z.output<KeySchema>, z.output<ValueSchema>][]> => {
        // Bypass the problematic storage wrapper iteration and use direct API
        const entry = storageWrapper.storageEntryOn(api);
        const rawEntries = await entry.entries();
        
        return rawEntries.map(([storageKey, rawValue]) => {
          const rawKey = storageKey.args[0];
          
          // Parse key
          const parsedKey = keySchema.safeParse(rawKey);
          if (!parsedKey.success) {
            throw new Error(`Failed to parse key: ${parsedKey.error.message}`);
          }
          
          // Convert value to JSON and parse
          const jsonValue = rawValue.toJSON();
          const parsedValue = valueSchema.safeParse(jsonValue);
          if (!parsedValue.success) {
            throw new Error(`Failed to parse value: ${parsedValue.error.message}`);
          }
          
          return [parsedKey.data, parsedValue.data];
        });
      },

      displayEntries: async (): Promise<[unknown, unknown][]> => {
        const entry = storageWrapper.storageEntryOn(api);
        const rawEntries = await entry.entries();
        
        return rawEntries.map(([storageKey, rawValue]) => {
          const rawKey = storageKey.args[0];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          const [parseError, humanReadable] = trySync(() => JSON.parse(rawValue.toString()));
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const displayValue = parseError ? rawValue.toString() : humanReadable;
          return [rawKey, displayValue];
        });
      },
      
      keys: async (): Promise<z.output<KeySchema>[]> => {
        // Bypass the problematic storage wrapper iteration and use direct API
        const entry = storageWrapper.storageEntryOn(api);
        const rawKeys = await entry.keys();
        
        // Extract the actual keys from the storage keys
        return rawKeys.map(storageKey => {
          const rawKey = storageKey.args[0];
          const parsed = keySchema.safeParse(rawKey);
          if (!parsed.success) {
            throw new Error(`Failed to parse key: ${parsed.error.message}`);
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return parsed.data;
        }) as z.output<KeySchema>[];
      },
      
      subscribe: (
        key: z.input<KeySchema>,
        callback: (value: z.output<ValueSchema> | null) => void
      ) => {
        const entry = storageWrapper.storageEntryOn(api);
        return entry(key, (raw: unknown) => {
          if (raw === null || raw === undefined || (raw as { isEmpty?: boolean }).isEmpty) {
            callback(null);
            return;
          }
          const parsed = valueSchema.safeParse(raw);
          if (parsed.success) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            callback(parsed.data);
          }
        });
      },
      
      subscribeAll: (
        callback: (entries: [z.output<KeySchema>, z.output<ValueSchema>][]) => void
      ) => {
        const entry = storageWrapper.storageEntryOn(api);
        return entry.entries((rawEntries: [unknown, unknown][]) => {
          const parsedEntries: [z.output<KeySchema>, z.output<ValueSchema>][] = [];
          
          for (const [storageKey, rawValue] of rawEntries) {
            if (typeof storageKey === 'object' && storageKey !== null && 'args' in storageKey) {
              const args = (storageKey as { args: unknown[] }).args;
              const rawKey = args[0];
              const parsedKey = keySchema.safeParse(rawKey);
              const parsedValue = valueSchema.safeParse(rawValue);
              
              if (parsedKey.success && parsedValue.success) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                parsedEntries.push([parsedKey.data, parsedValue.data]);
              }
            }
          }
          
          callback(parsedEntries);
        });
      },
      
      multi: async (keys: z.input<KeySchema>[]): Promise<(z.output<ValueSchema> | null)[]> => {
        const entry = storageWrapper.storageEntryOn(api);
        const rawValues = await entry.multi(keys);
        
        return rawValues.map((raw: unknown) => {
          if (!raw || (typeof raw === 'object' && raw !== null && 'isEmpty' in raw && (raw as any).isEmpty)) {
            return null;
          }
          
          // Convert to JSON for schema validation, similar to get method
          const jsonValue = (raw as any).toJSON ? (raw as any).toJSON() : raw;
          const parsed = valueSchema.safeParse(jsonValue);
          if (!parsed.success) {
            throw new Error(`Failed to parse value: ${parsed.error.message}`);
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return parsed.data as z.output<ValueSchema>;
        });
      },
      
      at: async (
        blockHash: string,
        key: z.input<KeySchema>
      ): Promise<z.output<ValueSchema> | null> => {
        const entry = storageWrapper.storageEntryOn(api);
        const raw = await entry.at(blockHash, key);
        
        if (typeof raw === 'object' && 'isEmpty' in raw && raw.isEmpty) {
          return null;
        }
        
        const parsed = valueSchema.safeParse(raw);
        if (!parsed.success) {
          throw new Error(`Failed to parse ${pallet}.${storage}: ${parsed.error.message}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return parsed.data;
      }
    })
  };
}