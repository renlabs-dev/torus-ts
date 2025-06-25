// storage/core/storage-map.ts
import type { ApiPromise } from '@polkadot/api';
import type { z } from 'zod';
import { SbStorageMap } from '../../storage';
import { trySync } from '@torus-network/torus-utils/try-catch';
import { sb_to_primitive } from '../../../types/zod';

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
        
        // Pass raw value directly to schema for proper substrate type handling
        const parsed = valueSchema.safeParse(rawValue, {
          path: ["storage", pallet, storage, String(key)],
        });
        
        if (!parsed.success) {
          throw new Error(`Failed to query ${pallet}.${storage}: ${parsed.error.message}`);
        }
        
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return parsed.data;
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
          
          // Parse raw value directly with schema
          const parsedValue = valueSchema.safeParse(rawValue);
          if (!parsedValue.success) {
            throw new Error(`Failed to parse value: ${parsedValue.error.message}`);
          }
          
          return [parsedKey.data, parsedValue.data];
        });
      },
      
      keys: async (): Promise<z.output<KeySchema>[]> => {
        // Bypass the problematic storage wrapper iteration and use direct API
        const entry = storageWrapper.storageEntryOn(api);
        const rawKeys = await entry.keys();
        
        // Return raw keys for .get() calls - don't transform them
        // The keys need to remain in their original substrate format for API calls
        return rawKeys.map(storageKey => {
          const rawKey = storageKey.args[0];
          
          // With z.any(), just return the raw key as-is
          // The .get() method expects the original substrate key format
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
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          if (!raw || (typeof raw === 'object' && raw !== null && 'isEmpty' in raw && (raw as any).isEmpty)) {
            return null;
          }
          
          // Parse raw value directly with schema
          const parsed = valueSchema.safeParse(raw);
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