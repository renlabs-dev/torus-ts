import { describe, expect, it } from "vitest";
import {
  tryAsync,
  tryAsyncRawError,
} from "../error_handler/gogotry/async-operations";

describe("gogotry async functions", () => {
  // Mock successful async function
  const successfulAsyncFn = () => {
    return Promise.resolve("success");
  };

  // Mock failing async function
  const failingAsyncFn = () => {
    return Promise.reject(new Error("async error"));
  };

  describe("tryAsync", () => {
    it("should return [undefined, result] when async operation succeeds", async () => {
      const [error, result] = await tryAsync(successfulAsyncFn());

      expect(error).toBeUndefined();
      expect(result).toBe("success");
    });

    it("should return [error, undefined] when async operation fails", async () => {
      const [error, result] = await tryAsync(failingAsyncFn());

      expect(error).toBe("async error");
      expect(result).toBeUndefined();
    });

    it("should handle function that returns a promise", async () => {
      const [error, result] = await tryAsync(() => {
        return Promise.resolve("promise result");
      });

      expect(error).toBeUndefined();
      expect(result).toBe("promise result");
    });

    it("should handle promise directly", async () => {
      const promise = Promise.resolve("direct promise");
      const [error, result] = await tryAsync(promise);

      expect(error).toBeUndefined();
      expect(result).toBe("direct promise");
    });
  });

  describe("tryAsyncRawError", () => {
    it("should return [undefined, result] when async operation succeeds", async () => {
      const [error, result] = await tryAsyncRawError(successfulAsyncFn());

      expect(error).toBeUndefined();
      expect(result).toBe("success");
    });

    it("should return [error, undefined] with full error object when async operation fails", async () => {
      const [error, result] = await tryAsyncRawError(failingAsyncFn());

      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("sync error");
      }
      expect(result).toBeUndefined();
    });
  });
});
