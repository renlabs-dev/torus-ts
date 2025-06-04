import { describe, expect, it } from "vitest";

import type { MultiError } from "./error";
import { chainErr, ErrorArray } from "./error";

describe("chainErr", () => {
  it("should chain error messages with default Error constructor", () => {
    const originalError = new Error("Original error message");
    const chainedError = chainErr("Failed to process")(originalError);

    expect(chainedError).toBeInstanceOf(Error);
    expect(chainedError.message).toBe(
      "Failed to process: Original error message",
    );
    expect(chainedError.cause).toBe(originalError);
  });

  it("should use custom error constructor when provided", () => {
    class CustomError extends Error {
      constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "CustomError";
      }
    }

    const originalError = new Error("Database connection failed");
    const chainedError = chainErr(
      "Failed to fetch user",
      CustomError,
    )(originalError);

    expect(chainedError).toBeInstanceOf(CustomError);
    expect(chainedError.name).toBe("CustomError");
    expect(chainedError.message).toBe(
      "Failed to fetch user: Database connection failed",
    );
    expect(chainedError.cause).toBe(originalError);
  });

  it("should preserve the error chain with multiple applications", () => {
    const baseError = new Error("Network timeout");
    const firstChain = chainErr("Failed to fetch data")(baseError);
    const secondChain = chainErr("Failed to load user profile")(firstChain);

    expect(secondChain.message).toBe(
      "Failed to load user profile: Failed to fetch data: Network timeout",
    );
    expect(secondChain.cause).toBe(firstChain);
    expect((secondChain.cause as Error).cause).toBe(baseError);
  });

  it("should work with different error types", () => {
    const typeError = new TypeError("Cannot read property 'x' of undefined");
    const chainedError = chainErr("Failed to parse response")(typeError);

    expect(chainedError.message).toBe(
      "Failed to parse response: Cannot read property 'x' of undefined",
    );
    expect(chainedError.cause).toBe(typeError);
  });

  it("should handle errors with empty messages", () => {
    const emptyError = new Error("");
    const chainedError = chainErr("Operation failed")(emptyError);

    expect(chainedError.message).toBe("Operation failed: ");
    expect(chainedError.cause).toBe(emptyError);
  });

  it("should work with built-in error constructors", () => {
    const originalError = new Error("Invalid input");

    const typeError = chainErr(
      "Type validation failed",
      TypeError,
    )(originalError);
    expect(typeError).toBeInstanceOf(TypeError);
    expect(typeError.message).toBe("Type validation failed: Invalid input");

    const rangeError = chainErr(
      "Value out of range",
      RangeError,
    )(originalError);
    expect(rangeError).toBeInstanceOf(RangeError);
    expect(rangeError.message).toBe("Value out of range: Invalid input");
  });

  it("should preserve stack traces", () => {
    const originalError = new Error("Original error");
    const chainedError = chainErr("Context added")(originalError);

    expect(chainedError.stack).toBeDefined();
    expect(originalError.stack).toBeDefined();
    // Stack traces should be different since they're different error objects
    expect(chainedError.stack).not.toBe(originalError.stack);
  });

  it("should handle errors with additional properties", () => {
    class DetailedError extends Error {
      constructor(
        message: string,
        public code: string,
        public statusCode: number,
        options?: ErrorOptions,
      ) {
        super(message, options);
        this.name = "DetailedError";
      }
    }

    const originalError = new DetailedError("Not found", "USER_NOT_FOUND", 404);
    const chainedError = chainErr("Failed to fetch user data")(originalError);

    expect(chainedError.message).toBe("Failed to fetch user data: Not found");
    expect(chainedError.cause).toBe(originalError);
    expect((chainedError.cause as DetailedError).code).toBe("USER_NOT_FOUND");
    expect((chainedError.cause as DetailedError).statusCode).toBe(404);
  });
});

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
    console.log(errorArray.stack);
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
    // expect(errorArray.filter((e) => e.message.includes("First"))).toEqual([
    //   error1,
    // ]);
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
