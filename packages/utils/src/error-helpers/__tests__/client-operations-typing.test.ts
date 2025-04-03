import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import {
  tryAsyncToast,
  tryAsyncToastRaw,
  trySyncToast,
  trySyncToastRaw,
} from "../client-operations";

const coinFlip = () => !Math.round(Math.random());

describe("Client error handling functions result type inference", () => {
  class CustomError extends Error {}

  // Mock the console.error method to prevent logs during tests
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => ({}));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeSyncToastResult = () =>
    trySyncToast<number>(() => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return 42;
    });

  const makeAsyncToastResult = () =>
    tryAsyncToast<number>(async () => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return await Promise.resolve(42);
    });

  const makeSyncToastRawResult = () =>
    trySyncToastRaw<CustomError, number>(() => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return 42;
    });

  const makeAsyncToastRawResult = () =>
    tryAsyncToastRaw<CustomError, number>(async () => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return await Promise.resolve(42);
    });

  describe("trySyncToast", () => {
    it("should infer the value type if the error is checked", () => {
      const result = makeSyncToastResult();

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

  describe("tryAsyncToast", () => {
    it("should infer the value type if the error is checked", async () => {
      const result = makeAsyncToastResult();

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

  describe("trySyncToastRaw", () => {
    it("should infer the value type if the error is checked", () => {
      const result = makeSyncToastRawResult();

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
      const result = makeSyncToastRawResult();

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

  describe("tryAsyncToastRaw", () => {
    it("should infer the value type if the error is checked", async () => {
      const result = makeAsyncToastRawResult();

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
      const result = makeAsyncToastRawResult();

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
