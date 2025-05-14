import { assert } from "tsafe";
import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { makeErr, makeErrFrom, makeOk } from "../result";
import type { Result } from "../result";
import {
  ensureError,
  tryAsync,
  tryAsyncRaw,
  tryAsyncStr,
  trySyncRaw,
  trySyncStr,
} from "../try-catch";

const coinFlip = () => !Math.round(Math.random());
const asyncCoinFlip = () => Promise.resolve(!Math.round(Math.random()));

describe("Error handling functions result type inference", () => {
  class CustomError extends Error {}

  const makeSyncResult = () =>
    trySyncStr<number>(() => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return 42;
    });

  const makeAsyncResult = () =>
    tryAsyncStr<number>(
      (async () => {
        if (coinFlip()) {
          throw new CustomError("fubá");
        }
        return await Promise.resolve(42);
      })(),
    );

  const makeSyncRawResult = () =>
    trySyncRaw<number, CustomError>(() => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return 42;
    }, ensureError);

  const makeAsyncRawResult = () =>
    tryAsyncRaw<number, CustomError>(
      (async () => {
        if (coinFlip()) {
          throw new CustomError("fubá");
        }
        return await Promise.resolve(42);
      })(),
      ensureError,
    );

  describe("trySync", () => {
    it("should infer the value type if the error is checked", () => {
      const result = makeSyncResult();

      const [err, val] = result;

      if (err !== undefined) {
        expect(err).toBeTypeOf("string");
        expectTypeOf(err).toEqualTypeOf<string>();
        expect(val).toBeUndefined();
        // TODO: Fix type: type of value should be inferred when error type is refined
        expectTypeOf(val).toEqualTypeOf<undefined>();
      } else {
        expect(err).toBeUndefined();
        expectTypeOf(err).toBeUndefined();
        expect(val).toBe(42);
        // TODO: Fix type: type of value should be inferred when error type is refined
        expectTypeOf(val).toEqualTypeOf<number>();
      }
    });
  });

  describe("tryAsync", () => {
    it("should infer the value type if the error is checked", async () => {
      const result = makeAsyncResult();

      const [err, val] = await result;

      if (err !== undefined) {
        expect(err).toBeTypeOf("string");
        expectTypeOf(err).toEqualTypeOf<string>();
        expect(val).toBeUndefined();
        // TODO: Fix type: type of value should be inferred when error type is refined
        expectTypeOf(val).toEqualTypeOf<undefined>();
      } else {
        expect(err).toBeUndefined();
        expectTypeOf(err).toBeUndefined();
        expect(val).toBe(42);
        // TODO: Fix type: type of value should be inferred when error type is refined
        expectTypeOf(val).toEqualTypeOf<number>();
      }
    });
  });

  describe("trySyncRawError", () => {
    it("should infer the value type if the error is checked", () => {
      const result = makeSyncRawResult();

      const [err, val] = result;

      if (err !== undefined) {
        expect(err).toBeInstanceOf(CustomError);
        expectTypeOf(err).toEqualTypeOf<CustomError>();
        expect(val).toBeUndefined();
        // TODO: Fix type: type of value should be inferred when error type is refined
        expectTypeOf(val).toEqualTypeOf<undefined>();
      } else {
        expect(err).toBeUndefined();
        expectTypeOf(err).toBeUndefined();
        expect(val).toBe(42);
        // TODO: Fix type: type of value should be inferred when error type is refined
        expectTypeOf(val).toEqualTypeOf<number>();
      }
    });

    it("should infer the type of the error if value is checked", () => {
      const result = makeSyncRawResult();

      const [err, val] = result;

      if (val !== undefined) {
        expect(val).toBe(42);
        expectTypeOf(val).toEqualTypeOf<number>();
        expect(err).toBeUndefined();
        // TODO: Fix type: type of error should be inferred when value type is refined
        expectTypeOf(err).toBeUndefined();
      } else {
        expect(val).toBeUndefined();
        expectTypeOf(val).toEqualTypeOf<undefined>();
        expect(err).toBeInstanceOf(CustomError);
        // TODO: Fix type: type of error should be inferred when value type is refined
        expectTypeOf(err).toEqualTypeOf<CustomError>();
      }
    });
  });

  describe("tryAsyncRawError", () => {
    it("should infer the value type if the error is checked", async () => {
      const result = makeAsyncRawResult();

      const [err, val] = await result;

      if (err !== undefined) {
        expect(err).toBeInstanceOf(CustomError);
        expectTypeOf(err).toEqualTypeOf<CustomError>();
        expect(val).toBeUndefined();
        // TODO: Fix type: type of value should be inferred when error type is refined
        expectTypeOf(val).toEqualTypeOf<undefined>();
      } else {
        expect(err).toBeUndefined();
        expectTypeOf(err).toBeUndefined();
        expect(val).toBe(42);
        // TODO: Fix type: type of value should be inferred when error type is refined
        expectTypeOf(val).toEqualTypeOf<number>();
      }
    });

    it("should infer the type of the error if value is checked", async () => {
      const result = makeAsyncRawResult();

      const [err, val] = await result;

      if (val !== undefined) {
        expect(val).toBe(42);
        expectTypeOf(val).toEqualTypeOf<number>();
        expect(err).toBeUndefined();
        // TODO: Fix type: type of error should be inferred when value type is refined
        expectTypeOf(err).toBeUndefined();
      } else {
        expect(val).toBeUndefined();
        expectTypeOf(val).toEqualTypeOf<undefined>();
        expect(err).toBeInstanceOf(CustomError);
        // TODO: Fix type: type of error should be inferred when value type is refined
        expectTypeOf(err).toEqualTypeOf<CustomError>();
      }
    });
  });
});

describe("We should be able to bubble up errors type-safely in raw error handling", () => {
  it("should bubble up errors", async () => {
    class ResNotAvailable extends Error {
      constructor(public name: string) {
        super(`Resource ${name} not available`);
      }
    }

    class InternalError<T> extends Error {
      constructor(public reason: T) {
        super(`Internal error: ${String(reason)}`);
      }
    }

    /** We don't know if this function can throw and error. It's from an
     * external library, and it's typing doesn't indicate that it can fail.
     */
    async function blackBox(): Promise<number> {
      const d = (await asyncCoinFlip()) ? 2 : 0;
      return 1 / d;
    }

    /** Some resource */
    class Res {
      async use(): Promise<Result<number, InternalError<unknown>>> {
        // TODO: replace with `tryAsyncRaw`
        const result = await tryAsync(blackBox());
        const [err, val] = result;
        if (err !== undefined) {
          return makeErrFrom(InternalError)(err);
        }
        return makeOk(val + 10);
      }
    }

    // Function that gets some resource like DB connection
    function getDb(): Promise<Result<Res, ResNotAvailable>> {
      const result = tryAsyncRaw(
        (async () => {
          if (coinFlip()) {
            throw new ResNotAvailable("fubá");
          }
          return await Promise.resolve(new Res());
        })(),
        (e) => z.instanceof(ResNotAvailable).parse(e),
      );
      return result;
    }

    const doSomething = async (): Promise<
      Result<number, ResNotAvailable | InternalError<unknown>>
    > => {
      const [err, res] = await getDb();
      if (err) {
        return makeErr(err);
      }
      const [err2, val] = await res.use();
      if (err2) {
        return makeErr(err2);
      }
      return makeOk(val + 3);
    };

    async function run() {
      const [err, val] = await doSomething();
      if (err) {
        if (err instanceof ResNotAvailable) {
          console.log(err.name);
        } else if (err instanceof InternalError) {
          console.log(err.reason);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          assert(err == null);
        }
      }
      console.log(val);
    }

    await run();
  });
});
