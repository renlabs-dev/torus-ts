import { describe, expect, it } from "vitest";
import {
  trySync,
  trySyncRawError,
} from "../error_handler/gogotry/sync-operations";

describe("gogotry sync functions", () => {
  // Mock successful sync function
  const successfulSyncFn = () => {
    return "success";
  };

  // Mock failing sync function
  const failingSyncFn = () => {
    throw new Error("sync error");
  };

  describe("trySync", () => {
    it("should return [undefined, result] when sync operation succeeds", () => {
      const [error, result] = trySync(successfulSyncFn);

      expect(error).toBeUndefined();
      expect(result).toBe("success");
    });

    it("should return [error, undefined] when sync operation fails", () => {
      const [error, result] = trySync(failingSyncFn);

      expect(error).toBe("sync error");
      expect(result).toBeUndefined();
    });

    it("should handle inline function", () => {
      const [error, result] = trySync(() => "inline result");

      expect(error).toBeUndefined();
      expect(result).toBe("inline result");
    });

    it("should handle JSON parsing errors", () => {
      const [error, result] = trySync<Record<string, unknown>>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        () => JSON.parse("{invalid json}"),
      );

      expect(error).not.toBeUndefined();
      expect(result).toBeUndefined();
    });
  });

  describe("trySyncRawError", () => {
    it("should return [undefined, result] when sync operation succeeds", () => {
      const [error, result] = trySyncRawError(successfulSyncFn);

      expect(error).toBeUndefined();
      expect(result).toBe("success");
    });

    it("should return [error, undefined] with full error object when sync operation fails", () => {
      const [error, result] = trySyncRawError(failingSyncFn);

      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("sync error");
      }
      expect(result).toBeUndefined();
    });
  });
});
