// storage/factories.ts
import type { z } from 'zod';
import type { ApiPromise } from '@polkadot/api';
import { SbStorageValue, SbStorageMap, SbStorageDoubleMap } from './storage';
import { isErr } from '@torus-network/torus-utils/result';

// Factory for storage values
export function createStorageValue<
  P extends string,
  S extends string,
  T extends z.ZodTypeAny
>(
  pallet: P,
  storage: S,
  schema: T
) {
  const storageWrapper = new SbStorageValue(pallet as any, storage as any, schema);
  
  return (api: ApiPromise) => ({
    async get(): Promise<z.output<T>> {
      const result = await storageWrapper.query(api)();
      if (isErr(result)) throw result[0];
      return result[1];
    },
    
    subscribe(callback: (value: z.output<T>) => void) {
      const entry = storageWrapper.storageEntryOn(api);
      return entry((raw: any) => {
        const parsed = schema.safeParse(raw);
        if (parsed.success) callback(parsed.data);
      });
    },
    
    async at(blockHash: string): Promise<z.output<T>> {
      const entry = storageWrapper.storageEntryOn(api);
      const raw = await entry.at(blockHash);
      const parsed = schema.safeParse(raw);
      if (!parsed.success) throw parsed.error;
      return parsed.data;
    }
  });
}

// Factory for storage maps
export function createStorageMap<
  P extends string,
  S extends string,
  K extends z.ZodTypeAny,
  V extends z.ZodTypeAny
>(
  pallet: P,
  storage: S,
  keySchema: K,
  valueSchema: V
) {
  const storageWrapper = new SbStorageMap(pallet as any, storage as any, keySchema, valueSchema);
  
  return (api: ApiPromise) => ({
    async get(key: z.input<K>): Promise<z.output<V> | null> {
      const result = await storageWrapper.query(api)(key);
      if (isErr(result)) throw result[0];
      return result[1];
    },
    
    async entries(): Promise<[z.output<K>, z.output<V>][]> {
      const result = await storageWrapper.iter(api);
      if (isErr(result)) throw result[0];
      return Array.from(result[1].entries());
    }
  });
}

// Factory for double maps
export function createStorageDoubleMap<
  P extends string,
  S extends string,
  K1 extends z.ZodTypeAny,
  K2 extends z.ZodTypeAny,
  V extends z.ZodTypeAny
>(
  pallet: P,
  storage: S,
  key1Schema: K1,
  key2Schema: K2,
  valueSchema: V
) {
  const storageWrapper = new SbStorageDoubleMap(
    pallet as any, 
    storage as any, 
    key1Schema, 
    key2Schema, 
    valueSchema
  );
  
  return (api: ApiPromise) => ({
    async get(key1: z.input<K1>, key2: z.input<K2>): Promise<z.output<V> | null> {
      const result = await storageWrapper.query(api)(key1, key2);
      if (isErr(result)) throw result[0];
      return result[1];
    },
    
    async entries(): Promise<[z.output<K1>, z.output<K2>, z.output<V>][]> {
      const result = await storageWrapper.iter(api);
      if (isErr(result)) throw result[0];
      
      const entries: [z.output<K1>, z.output<K2>, z.output<V>][] = [];
      for (const [k1, map] of result[1].entries()) {
        for (const [k2, value] of map.entries()) {
          entries.push([k1, k2, value]);
        }
      }
      return entries;
    },
    
    async entriesByKey1(key1: z.input<K1>): Promise<[z.output<K2>, z.output<V>][]> {
      const result = await storageWrapper.iter(api);
      if (isErr(result)) throw result[0];
      
      const map = result[1].get(key1);
      if (!map) return [];
      
      return Array.from(map.entries());
    }
  });
}