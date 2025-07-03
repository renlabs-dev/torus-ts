/* TODO: Turn Zod parsing errors into non-value unexpected runtime errors.

   TODO: Also check raw Codec key type against input type of Zod schema like we
     do for the value schema.

   TODO: Tests.
*/

import type { ApiPromise } from "@polkadot/api";
import type { Equals, Extends } from "tsafe";
import { assert } from "tsafe";
import type { z } from "zod";

import type { MultiError } from "@torus-network/torus-utils/error";
import { ErrorArray } from "@torus-network/torus-utils/error";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type {
  ExtractSignatures,
  NthReturnTypeOverloaded,
} from "@torus-network/torus-utils/typing";

import { sb_address, sb_amount, sb_bigint, sb_some } from "../types/index.js";

type Api = ApiPromise;

type PalletName = keyof Api["query"] & string;
type StorageName = keyof Api["query"][PalletName];

type AnyEntry = Api["query"][PalletName][StorageName];

type EntryAt<P extends PalletName, S extends StorageName> = Api["query"][P][S];

// ==== Storage entry base class ====

abstract class SbStorageBase<
  Pallet extends PalletName,
  Storage extends StorageName,
> {
  abstract readonly _raw_type: unknown;
  abstract readonly _parsed_type: unknown;

  constructor(
    public readonly palletName: Pallet,
    public readonly storageName: Storage,
  ) {}

  abstract get checkType(): boolean;

  /**
   * Retrieves the actual specific storage entry object from a Substrate API for
   * the configured pallet and storage item.
   *
   * @param api - The Substrate API instance to query
   * @returns The storage entry object that can be used to query the state
   * @throws {Error} If the specified pallet does not exist in the API
   * @throws {Error} If the specified storage item does not exist in the pallet
   */
  storageEntryOn(api: Api): EntryAt<Pallet, Storage> {
    const pallet: Api["query"][Pallet] = api.query[this.palletName];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    assert(pallet != undefined, `Pallet ${this.palletName} not found`);
    const storage: EntryAt<Pallet, Storage> = pallet[this.storageName];
    assert(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      storage != undefined,
      `Storage ${String(this.storageName)} not found`,
    );
    return storage;
  }
}

// ==== Single storage entry ====

type ReturnOfSingleEntry<E extends AnyEntry> = Awaited<
  NthReturnTypeOverloaded<E, [], 0>
>;

/**
 * Describes a storage entry in a substrate chain, including its pallet and
 * storage names, and a Zod parser for the storage value.
 */
export class SbStorageValue<
  Pallet extends PalletName,
  Storage extends StorageName,
  Schema extends z.ZodTypeAny,
> extends SbStorageBase<Pallet, Storage> {
  readonly _raw_type!: z.input<Schema>;
  readonly _parsed_type!: z.output<Schema>;

  constructor(
    public readonly palletName: Pallet,
    public readonly storageName: Storage,
    public readonly valueSchema: Schema,
  ) {
    super(palletName, storageName);
  }

  /**
   * Queries raw data from a substrate blockchain storage.
   *
   * @param api - The substrate API instance used to access the blockchain
   * @returns The raw value (Codec) retrieved from the storage entry
   */
  queryRaw(
    api: Api,
  ): () => Promise<ReturnOfSingleEntry<EntryAt<Pallet, Storage>>> {
    type Entry = EntryAt<Pallet, Storage>;
    const storage: Entry = this.storageEntryOn(api);
    return () => storage() as Promise<ReturnOfSingleEntry<Entry>>;
  }

  /**
   * Queries the substrate storage and parses the result according to the
   * defined schema.
   *
   * @param api - The substrate API instance used to perform the query
   * @returns The successfully parsed value that matches the schema, or a
   *   ZodError if the retrieved data doesn't conform
   * @throws May throw errors from the underlying query if the substrate API
   *   call fails
   */
  query(
    api: Api,
  ): () => Promise<Result<z.output<Schema>, z.ZodError<z.input<Schema>>>> {
    const query = this.queryRaw(api);
    return async () => {
      const rawValue = await query();
      const parsed = this.valueSchema.safeParse(rawValue, {
        path: ["storage", this.palletName, this.storageName],
      });
      if (parsed.success === false) {
        return makeErr(parsed.error);
      }
      return makeOk(parsed.data);
    };
  }

  /**
   * Performs a compile-time type check to verify that the expected return type
   * of the storage entry conforms to the input type of the provided Zod schema.
   *
   * @returns A type representing the constraint that the storage entry's return
   *   type extends the schema's input type
   * @throws {Error} Always throws an error when called at runtime as this
   *   method is intended for type checking only
   */
  get checkType(): Extends<
    ReturnOfSingleEntry<EntryAt<Pallet, Storage>>,
    z.input<Schema>
  > {
    throw new Error("Type-only");
  }
}

// ==== Map storage entry ====

type ParamOfMapEntry<E extends AnyEntry> = Awaited<
  ExtractSignatures<E>
>[0][0][0];

type ReturnOfMapEntry<E extends AnyEntry> = Awaited<
  NthReturnTypeOverloaded<E, [ParamOfMapEntry<E>], 0>
>;

export class SbStorageMap<
  Pallet extends PalletName,
  Storage extends StorageName,
  Key1Schema extends z.ZodType<unknown, z.ZodTypeDef, unknown>,
  ValSchema extends z.ZodType<unknown, z.ZodTypeDef, unknown>,
> extends SbStorageBase<Pallet, Storage> {
  readonly _raw_type!: z.input<Key1Schema>;
  readonly _parsed_type!: z.output<Key1Schema>;

  constructor(
    palletName: Pallet,
    storageName: Storage,
    public readonly key1Schema: Key1Schema,
    public readonly valueSchema: ValSchema,
  ) {
    super(palletName, storageName);
  }

  queryRaw(
    api: Api,
  ): (
    key: ParamOfMapEntry<EntryAt<Pallet, Storage>>,
  ) => Promise<ReturnOfMapEntry<EntryAt<Pallet, Storage>>> {
    type Entry = EntryAt<Pallet, Storage>;
    const storage: Entry = this.storageEntryOn(api);
    return (key) => storage(key) as Promise<ReturnOfMapEntry<Entry>>;
  }

  query(
    api: Api,
  ): (
    key: ParamOfMapEntry<EntryAt<Pallet, Storage>>,
  ) => Promise<Result<z.output<ValSchema>, z.ZodError<z.input<ValSchema>>>> {
    const query = this.queryRaw(api);
    return async (key) => {
      const rawValue = await query(key);
      const parsed = this.valueSchema.safeParse(rawValue, {
        path: ["storage", this.palletName, this.storageName, String(key)],
      });
      if (parsed.success === false) {
        return makeErr(parsed.error);
      }
      return makeOk(parsed.data);
    };
  }

  get checkType(): Extends<
    ReturnOfMapEntry<EntryAt<Pallet, Storage>>,
    z.input<ValSchema>
  > {
    throw new Error("Type-only");
  }

  /**
   * Iterates over all entries in the storage map and returns them parsed
   * according to the schemas.
   *
   * @param api - The substrate API instance used to perform the query
   * @returns A Result containing a Map of parsed key-value pairs, or an error
   * if the query or parsing fails
   */
  async iter(
    api: Api,
  ): Promise<
    Result<Map<z.output<Key1Schema>, z.output<ValSchema>>, MultiError>
  > {
    type Entry = EntryAt<Pallet, Storage>;
    const storage: Entry = this.storageEntryOn(api);

    // Query all entries from the storage map
    const [queryError, rawEntries] = await tryAsync(storage.entries());
    if (queryError !== undefined) {
      return makeErr(ErrorArray.from([queryError]));
    }

    const entries = new Map<z.output<Key1Schema>, z.output<ValSchema>>();
    const errors: Error[] = [];

    for (const [storageKey, rawValue] of rawEntries) {
      // Extract the key from the storage key
      const [rawKey] = storageKey.args;

      const parsedKey1 = this.key1Schema.safeParse(rawKey, {
        path: ["storage", this.palletName, this.storageName, String(rawKey)],
      });
      if (parsedKey1.success === false) {
        errors.push(parsedKey1.error);
        continue;
      }
      const key1 = parsedKey1.data;

      const parsedValue = this.valueSchema.safeParse(rawValue, {
        path: ["storage", this.palletName, this.storageName, String(key1)],
      });
      if (parsedValue.success === false) {
        errors.push(parsedValue.error);
        continue;
      }
      const value = parsedValue.data;

      entries.set(key1, value);
    }

    // If there were any parsing errors, return them
    if (errors.length > 0) {
      return makeErr(ErrorArray.from(errors));
    }

    return makeOk(entries);
  }
}

// ==== Double map storage entry ====

type ParamsOfDoubleMapEntry<E extends AnyEntry> = Awaited<
  ExtractSignatures<E>
>[0][0];

type ReturnOfDoubleMapEntry<E extends AnyEntry> = Awaited<
  NthReturnTypeOverloaded<E, ParamsOfDoubleMapEntry<E>, 0>
>;

export class SbStorageDoubleMap<
  Pallet extends PalletName,
  Storage extends StorageName,
  Key1Schema extends z.ZodTypeAny,
  Key2Schema extends z.ZodTypeAny,
  ValSchema extends z.ZodTypeAny,
> extends SbStorageBase<Pallet, Storage> {
  readonly _raw_type!: z.input<Key1Schema>;
  readonly _parsed_type!: z.output<Key1Schema>;

  constructor(
    palletName: Pallet,
    storageName: Storage,
    public readonly key1Schema: Key1Schema,
    public readonly key2Schema: Key2Schema,
    public readonly valueSchema: ValSchema,
  ) {
    super(palletName, storageName);
  }

  queryRaw(
    api: Api,
  ): (
    key1: ParamsOfDoubleMapEntry<EntryAt<Pallet, Storage>>[0],
    key2: ParamsOfDoubleMapEntry<EntryAt<Pallet, Storage>>[1],
  ) => Promise<ReturnOfDoubleMapEntry<EntryAt<Pallet, Storage>>> {
    type Entry = EntryAt<Pallet, Storage>;
    const storage: Entry = this.storageEntryOn(api);
    return (key1, key2) =>
      storage(key1, key2) as Promise<ReturnOfDoubleMapEntry<Entry>>;
  }

  query(
    api: Api,
  ): (
    key1: ParamsOfDoubleMapEntry<EntryAt<Pallet, Storage>>[0],
    key2: ParamsOfDoubleMapEntry<EntryAt<Pallet, Storage>>[1],
  ) => Promise<Result<z.output<ValSchema>, z.ZodError<z.input<ValSchema>>>> {
    const query = this.queryRaw(api);
    return async (key1, key2) => {
      const rawValue = await query(key1, key2);
      const parsed = this.valueSchema.safeParse(rawValue, {
        path: [
          "storage",
          this.palletName,
          this.storageName,
          String(key1),
          String(key2),
        ],
      });
      if (parsed.success === false) {
        return makeErr(parsed.error);
      }
      return makeOk(parsed.data);
    };
  }

  get checkType(): Extends<
    ReturnOfDoubleMapEntry<EntryAt<Pallet, Storage>>,
    z.input<ValSchema>
  > {
    throw new Error("Type-only");
  }

  /**
   * Iterates over all entries in the storage double map and returns them parsed
   * according to the schemas.
   *
   * @param api - The substrate API instance used to perform the query
   * @returns A Result containing a Map of parsed key-value pairs, or an error
   * if the query or parsing fails
   */
  async iter(
    api: Api,
  ): Promise<
    Result<
      Map<z.output<Key1Schema>, Map<z.output<Key2Schema>, z.output<ValSchema>>>,
      MultiError
    >
  > {
    type Entry = EntryAt<Pallet, Storage>;
    const storage: Entry = this.storageEntryOn(api);

    // Query all entries from the storage double map
    const [queryError, rawEntries] = await tryAsync(storage.entries());
    if (queryError !== undefined) {
      return makeErr(ErrorArray.from([queryError]));
    }

    const entries = new Map<
      z.output<Key1Schema>,
      Map<z.output<Key2Schema>, z.output<ValSchema>>
    >();
    const errors: Error[] = [];

    for (const [storageKey, rawValue] of rawEntries) {
      // Extract the keys from the storage key
      const [rawKey1, rawKey2] = storageKey.args;

      const parsedKey1 = this.key1Schema.safeParse(rawKey1, {
        path: [
          "storage",
          this.palletName,
          this.storageName,
          String(rawKey1),
          String(rawKey2),
        ],
      });
      if (parsedKey1.success === false) {
        errors.push(parsedKey1.error);
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const key1 = parsedKey1.data;

      const parsedKey2 = this.key2Schema.safeParse(rawKey2, {
        path: [
          "storage",
          this.palletName,
          this.storageName,
          String(key1),
          String(rawKey2),
        ],
      });
      if (parsedKey2.success === false) {
        errors.push(parsedKey2.error);
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const key2 = parsedKey2.data;

      const parsedValue = this.valueSchema.safeParse(rawValue, {
        path: [
          "storage",
          this.palletName,
          this.storageName,
          String(key1),
          String(key2),
        ],
      });
      if (parsedValue.success === false) {
        errors.push(parsedValue.error);
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = parsedValue.data;

      // Get or create the nested map for key1
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      let nestedMap = entries.get(key1);
      if (nestedMap === undefined) {
        nestedMap = new Map<z.output<Key2Schema>, z.output<ValSchema>>();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        entries.set(key1, nestedMap);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      nestedMap.set(key2, value);
    }

    // If there were any parsing errors, return them
    if (errors.length > 0) {
      return makeErr(ErrorArray.from(errors));
    }

    return makeOk(entries);
  }
}

// ==== Tests ====

/* eslint-disable @typescript-eslint/no-unused-vars */

async function _test() {
  const api = null as unknown as Api;
  // const x = api.query.torus0.agents();

  const stHard = api.query.torus0.totalStake;
  type StHard = typeof stHard;
  const valHard = await stHard();
  type ValHard = typeof valHard;

  type In = z.input<typeof sb_amount>;
  type Out = z.output<typeof sb_amount>;

  const sb_storage_def = new SbStorageValue("torus0", "totalStake", sb_amount);
  assert<typeof sb_storage_def.checkType>();

  const st = sb_storage_def.storageEntryOn(api);
  type St = typeof st;
  assert<Equals<St, StHard>>();

  const rawVal = await sb_storage_def.queryRaw(api)();
  type RawVal = typeof rawVal;
  assert<Equals<RawVal, ValHard>>();

  const val = await sb_storage_def.query(api)();
  type Val = typeof val;
}

async function _test2() {
  const api = null as unknown as Api;

  const stHard = api.query.torus0.agents;
  type StHard = typeof stHard;
  const valHard = await stHard("abc");
  type ValHard = typeof valHard;

  const sb_storage_def = new SbStorageMap(
    "torus0",
    "registrationBlock",
    sb_address,
    sb_some(sb_bigint),
  );
  // TODO : REVISE 
  // THIS IS IMPORTANT
  // assert<typeof sb_storage_def.checkType>();

  const rawVal = await sb_storage_def.queryRaw(api)(
    "0x1234567890123456789012345678901234567890",
  );

  const val = await sb_storage_def.query(api)(
    "0x1234567890123456789012345678901234567890",
  );
}

async function _test3() {
  const api = null as unknown as Api;

  const stHard = api.query.torus0.stakingTo;
  type StHard = typeof stHard;
  const valHard = await stHard("abc", "def");
  type ValHard = typeof valHard;

  const sb_storage_def = new SbStorageDoubleMap(
    "torus0",
    "stakingTo",
    sb_address,
    sb_address,
    sb_some(sb_bigint),
  );
  assert<typeof sb_storage_def.checkType>();

  const rawVal = await sb_storage_def.queryRaw(api)(
    "0x1234567890123456789012345678901234567890",
    "0x1234567890123456789012345678901234567890",
  );

  const val = await sb_storage_def.query(api)(
    "0x1234567890123456789012345678901234567890",
    "0x1234567890123456789012345678901234567890",
  );
}
