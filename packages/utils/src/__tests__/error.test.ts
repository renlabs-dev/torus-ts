import { describe, expect, it } from "vitest";

import type { MultiError } from "../error";
import { ErrorArray } from "../error";

describe("ErrorArray", () => {
  it("should create an ErrorArray from multiple errors", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");
    const errorArray = new ErrorArray([error1, error2]);

    expect(errorArray).toBeInstanceOf(ErrorArray);
    expect(errorArray).toBeInstanceOf(Array);
    expect(errorArray).not.toBeInstanceOf(Error);
    expect(errorArray.length).toBe(2);
    expect(errorArray[0]).toBe(error1);
    expect(errorArray[1]).toBe(error2);
    expect(errorArray[2]).toBeUndefined();
  });

  it("should combine error names with underscores by default", () => {
    const error1 = new Error("First error");
    error1.name = "ValidationError";
    const error2 = new Error("Second error");
    error2.name = "NetworkError";

    const errorArray = new ErrorArray([error1, error2]);
    expect(errorArray.name).toBe("ValidationError_NetworkError");
  });

  it("should use custom name when provided", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");

    const errorArray = new ErrorArray([error1, error2], {
      name: "CustomError",
    });
    expect(errorArray.name).toBe("CustomError");
  });

  it("should combine error messages with newlines by default", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");

    const errorArray = new ErrorArray([error1, error2]);
    expect(errorArray.message).toBe("First error\nSecond error");
  });

  it("should use custom message when provided", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");

    const errorArray = new ErrorArray([error1, error2], {
      message: "Custom combined message",
    });
    expect(errorArray.message).toBe("Custom combined message");
  });

  it("should set cause to the original errors array", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");
    const errors = [error1, error2];

    const errorArray = new ErrorArray(errors);
    expect(errorArray.cause).toBe(errors);
  });

  it("should combine stack traces with error numbering", () => {
    const error1 = new Error("First error");
    error1.name = "ValidationError";
    error1.stack = "ValidationError: First error\n    at line1";

    const error2 = new Error("Second error");
    error2.name = "NetworkError";
    error2.stack = "NetworkError: Second error\n    at line2";

    const errorArray = new ErrorArray([error1, error2]);

    expect(errorArray.stack).toContain("Error 1 (ValidationError)");
    expect(errorArray.stack).toContain(
      "ValidationError: First error\n    at line1",
    );
    expect(errorArray.stack).toContain("Error 2 (NetworkError)");
    expect(errorArray.stack).toContain(
      "NetworkError: Second error\n    at line2",
    );
  });

  it("should handle errors without stack traces", () => {
    const error1 = new Error("First error");
    error1.name = "TestError";
    delete error1.stack;

    const errorArray = new ErrorArray([error1]);
    expect(errorArray.stack).toContain("Error 1 (TestError) no stack");
  });

  it("should work with empty error array", () => {
    const errorArray = new ErrorArray([]);

    expect(errorArray.length).toBe(0);
    expect(errorArray.name).toBe("");
    expect(errorArray.message).toBe("");
    expect(errorArray.stack).toBe("");
  });

  it("should work with single error", () => {
    const error = new Error("Single error");
    error.name = "SingleError";

    const errorArray = new ErrorArray([error]);

    expect(errorArray.length).toBe(1);
    expect(errorArray.name).toBe("SingleError");
    expect(errorArray.message).toBe("Single error");
    expect(errorArray[0]).toBe(error);
  });

  it("should maintain array functionality", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");
    const errorArray = new ErrorArray([error1, error2]);

    // Test array methods
    expect(errorArray.map((e) => e.message)).toEqual([
      "First error",
      "Second error",
    ]);
    expect(errorArray.filter((e) => e.message.includes("First"))).toEqual([
      error1,
    ]);
    expect(errorArray.find((e) => e.message === "Second error")).toBe(error2);
  });

  it("should create ErrorArray using the from() static method", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");
    const errors = [error1, error2];

    const errorArray = ErrorArray.from(errors);

    expect(errorArray).toBeInstanceOf(ErrorArray);
    expect(errorArray).toBeInstanceOf(Array);
    expect(errorArray.length).toBe(2);
    expect(errorArray[0]).toBe(error1);
    expect(errorArray[1]).toBe(error2);
    expect(errorArray.errors).toBe(errors);
    expect(errorArray.message).toBe("First error\nSecond error");
    expect(errorArray.name).toBe("Error_Error");
  });

  it("should satisfy MultiError type constraint", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");
    const errorArray = new ErrorArray([error1, error2]);

    // Should work as Error
    const asError: Error = errorArray;
    expect(asError.name).toBe(errorArray.name);
    expect(asError.message).toBe(errorArray.message);

    // Should work as Array
    const asArray: Error[] = errorArray;
    expect(asArray.length).toBe(2);
    expect(asArray[0]).toBe(error1);

    // Should work as MultiError
    const asMultiError: MultiError = errorArray;
    expect(asMultiError.name).toBe(errorArray.name);
    expect(asMultiError.length).toBe(2);
  });

  it("should handle mixed error types", () => {
    class CustomError extends Error {
      constructor(
        message: string,
        public code: string,
      ) {
        super(message);
        this.name = "CustomError";
      }
    }

    const error1 = new Error("Standard error");
    const error2 = new CustomError("Custom error", "CUSTOM_001");
    const error3 = new TypeError("Type error");

    const errorArray = new ErrorArray([error1, error2, error3]);

    expect(errorArray.length).toBe(3);
    expect(errorArray.name).toBe("Error_CustomError_TypeError");
    expect(errorArray.message).toBe("Standard error\nCustom error\nType error");
  });
});
