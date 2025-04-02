import { describe, expect, expectTypeOf, it } from "vitest";
import { tryAsync, tryAsyncRawError } from "../async-operations";
import { trySync, trySyncRawError } from "../sync-operations";

const coinFlip = () => !Math.round(Math.random());

describe("Error handling functions result type inference", () => {
  class CustomError extends Error {}

  const makeSyncResult = () =>
    trySync<number>(() => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return 42;
    });

  const makeAsyncResult = () =>
    tryAsync<number>(async () => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return await Promise.resolve(42);
    });

  const makeSyncRawResult = () =>
    trySyncRawError<CustomError, number>(() => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return 42;
    });

  const makeAsyncRawResult = () =>
    tryAsyncRawError<CustomError, number>(async () => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return await Promise.resolve(42);
    });

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
