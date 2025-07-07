import { describe, expect, it } from "vitest";
import { trySync, trySyncStr } from "../try-catch.js";

// TODO: test `trySyncRaw`

describe("try sync functions", () => {
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
      const [error, result] = trySyncStr(successfulSyncFn);

      expect(error).toBeUndefined();
      expect(result).toBe("success");
    });

    it("should return [error, undefined] when sync operation fails", () => {
      const [error, result] = trySyncStr(failingSyncFn);

      expect(error).toBe("Error: sync error");
      expect(result).toBeUndefined();
    });

    it("should handle inline function", () => {
      const [error, result] = trySyncStr(() => "inline result");

      expect(error).toBeUndefined();
      expect(result).toBe("inline result");
    });

    it("should handle JSON parsing errors", () => {
      const [error, result] = trySyncStr<Record<string, unknown>>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        () => JSON.parse("{invalid json}"),
      );

      expect(error).not.toBeUndefined();
      expect(result).toBeUndefined();
    });
  });

  describe("trySyncRawError", () => {
    it("should return [undefined, result] when sync operation succeeds", () => {
      const [error, result] = trySync(successfulSyncFn);

      expect(error).toBeUndefined();
      expect(result).toBe("success");
    });

    it("should return [error, undefined] with full error object when sync operation fails", () => {
      const [error, result] = trySync(failingSyncFn);

      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("sync error");
      }
      expect(result).toBeUndefined();
    });
  });
});
