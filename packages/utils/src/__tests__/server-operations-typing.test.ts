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
  tryAsyncLogging,
  tryAsyncLoggingRaw,
  trySyncLogging,
  trySyncLoggingRaw,
} from "../error-helpers/server-operations";

const coinFlip = () => !Math.round(Math.random());

describe("Server error handling functions result type inference", () => {
  class CustomError extends Error {}

  // Mock the console methods to prevent logs during tests
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => ({}));
    vi.spyOn(console, "debug").mockImplementation(() => ({}));
    vi.spyOn(console, "info").mockImplementation(() => ({}));
    vi.spyOn(console, "warn").mockImplementation(() => ({}));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeSyncLoggingResult = () =>
    trySyncLogging<number>(() => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return 42;
    });

  const makeAsyncLoggingResult = () =>
    tryAsyncLogging<number>(
      (async () => {
        if (coinFlip()) {
          throw new CustomError("fubá");
        }
        return await Promise.resolve(42);
      })(),
    );

  const makeSyncLoggingRawResult = () =>
    trySyncLoggingRaw<number>(() => {
      if (coinFlip()) {
        throw new CustomError("fubá");
      }
      return 42;
    });

  const makeAsyncLoggingRawResult = () =>
    tryAsyncLoggingRaw<number>(
      (async () => {
        if (coinFlip()) {
          throw new CustomError("fubá");
        }
        return await Promise.resolve(42);
      })(),
    );

  describe("trySyncLogging", () => {
    it("should infer the value type if the error is checked", () => {
      const result = makeSyncLoggingResult();

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

  describe("tryAsyncLogging", () => {
    it("should infer the value type if the error is checked", async () => {
      const result = makeAsyncLoggingResult();

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

  describe("trySyncLoggingRaw", () => {
    it("should infer the value type if the error is checked", () => {
      const result = makeSyncLoggingRawResult();

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
      const result = makeSyncLoggingRawResult();

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

  describe("tryAsyncLoggingRaw", () => {
    it("should infer the value type if the error is checked", async () => {
      const result = makeAsyncLoggingRawResult();

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
      const result = makeAsyncLoggingRawResult();

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
