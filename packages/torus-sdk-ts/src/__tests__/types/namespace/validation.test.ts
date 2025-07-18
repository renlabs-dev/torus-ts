import { describe, expect, it } from "vitest";

import {
  isValidNamespacePath,
  isValidNamespaceSegment,
  NAMESPACE_SEGMENT_REGEX,
  namespacePathParser,
  namespaceSegmentField,
  validateNamespacePath,
  validateNamespaceSegment,
} from "../../../types/namespace/namespace-path.js";

describe("NamespaceSegmentValidation", () => {
  const testCases = {
    valid: [
      "a",
      "9",
      "test",
      "api-v2",
      "user_name1",
      "db-prod-01",
      "my_test_123",
      "snake_case1",
      "kebab-case2",
      "my+segment",
      "api+v2+prod",
      "test+123",
      "a+b+c",
      "a" + "b".repeat(61) + "c", // 63 chars
    ],
    invalid: [
      {
        value: "-test",
        error: "Path segment must start with a lowercase letter or digit",
      },
      {
        value: "_test",
        error: "Path segment must start with a lowercase letter or digit",
      },
      {
        value: "+test",
        error: "Path segment must start with a lowercase letter or digit",
      },
      {
        value: "test-",
        error: "Path segment must end with a lowercase letter or digit",
      },
      {
        value: "test_",
        error: "Path segment must end with a lowercase letter or digit",
      },
      {
        value: "test+",
        error: "Path segment must end with a lowercase letter or digit",
      },
      {
        value: "Test1",
        error: "Path segment cannot contain uppercase letters",
      },
      {
        value: "user@host1",
        error:
          "Path segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
      },
      { value: "", error: "Path segment is required" },
      {
        value: "a" + "b".repeat(62) + "c",
        error: "Path segment cannot exceed 63 characters",
      }, // 64 chars
      {
        value: "hello world1",
        error:
          "Path segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
      },
      {
        value: "test*segment",
        error:
          "Path segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
      },
    ],
  };

  describe("validateNamespaceSegment", () => {
    it.each(testCases.valid)(
      "should return Ok result for valid segment '%s'",
      (segment) => {
        const [error, result] = validateNamespaceSegment(segment);
        expect(error).toBeUndefined();
        expect(result).toBe(segment);
      },
    );

    it.each(testCases.invalid)(
      "should return Err result '$error' for invalid segment '$value'",
      ({ value, error }) => {
        const [err, result] = validateNamespaceSegment(value);
        expect(err).toBe(error);
        expect(result).toBeUndefined();
      },
    );
  });

  describe("isValidNamespaceSegment", () => {
    it.each(testCases.valid)(
      "should return true for valid segment '%s'",
      (segment) => {
        expect(isValidNamespaceSegment(segment)).toBe(true);
      },
    );

    it.each(testCases.invalid)(
      "should return false for invalid segment '$value'",
      ({ value }) => {
        expect(isValidNamespaceSegment(value)).toBe(false);
      },
    );
  });

  describe("NAMESPACE_SEGMENT_REGEX", () => {
    it.each(testCases.valid)("should match valid segment '%s'", (segment) => {
      expect(NAMESPACE_SEGMENT_REGEX.test(segment)).toBe(true);
    });

    it.each(testCases.invalid)(
      "should not match invalid segment '$value'",
      ({ value }) => {
        expect(NAMESPACE_SEGMENT_REGEX.test(value)).toBe(false);
      },
    );
  });

  describe("namespaceSegmentField", () => {
    const schema = namespaceSegmentField();

    it.each(testCases.valid)(
      "should validate valid segment '%s'",
      (segment) => {
        expect(schema.safeParse(segment).success).toBe(true);
      },
    );

    it.each(testCases.invalid)(
      "should reject invalid segment '$value' with error '$error'",
      ({ value, error }) => {
        const result = schema.safeParse(value);
        expect(result.success).toBe(false);
        if (!result.success && result.error.issues[0]) {
          expect(result.error.issues[0].message).toBe(error);
        }
      },
    );
  });
});

describe("NamespacePathValidation", () => {
  const testCases = {
    valid: [
      { path: "api", segments: ["api"] },
      { path: "api.v2", segments: ["api", "v2"] },
      { path: "api.v2.users", segments: ["api", "v2", "users"] },
      { path: "my-app.config", segments: ["my-app", "config"] },
      { path: "db.prod-01.users", segments: ["db", "prod-01", "users"] },
      { path: "service+core.api+v2", segments: ["service+core", "api+v2"] },
      { path: "a.b.c.d.e.f.g", segments: ["a", "b", "c", "d", "e", "f", "g"] },
      {
        path: "snake_case.kebab-case.plus+sign",
        segments: ["snake_case", "kebab-case", "plus+sign"],
      },
      { path: "1.2.3", segments: ["1", "2", "3"] },
      {
        path: "a" + "b".repeat(61) + "c",
        segments: ["a" + "b".repeat(61) + "c"],
      }, // 63 char segment
    ],
    invalid: [
      { path: "", error: "Path is required" },
      { path: ".", error: "Path segment is empty" },
      { path: "..", error: "Path segment is empty" },
      { path: "api.", error: "Path segment is empty" },
      { path: ".api", error: "Path segment is empty" },
      { path: "api..users", error: "Path segment is empty" },
      {
        path: "a" + "b".repeat(254) + "c",
        error: "Path cannot exceed 255 characters",
      }, // 256 chars
      {
        path: "-api",
        error:
          "Path is invalid: Path segment must start with a lowercase letter or digit",
      },
      {
        path: "_api",
        error:
          "Path is invalid: Path segment must start with a lowercase letter or digit",
      },
      {
        path: "+api",
        error:
          "Path is invalid: Path segment must start with a lowercase letter or digit",
      },
      {
        path: "api-",
        error:
          "Path is invalid: Path segment must end with a lowercase letter or digit",
      },
      {
        path: "api_",
        error:
          "Path is invalid: Path segment must end with a lowercase letter or digit",
      },
      {
        path: "api+",
        error:
          "Path is invalid: Path segment must end with a lowercase letter or digit",
      },
      {
        path: "Api.v2",
        error: "Path is invalid: Path segment cannot contain uppercase letters",
      },
      {
        path: "api.V2",
        error: "Path is invalid: Path segment cannot contain uppercase letters",
      },
      {
        path: "api.users@host",
        error:
          "Path is invalid: Path segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
      },
      {
        path: "api.hello world",
        error:
          "Path is invalid: Path segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
      },
      {
        path: "api.-users",
        error:
          "Path is invalid: Path segment must start with a lowercase letter or digit",
      },
      {
        path: "api.users-",
        error:
          "Path is invalid: Path segment must end with a lowercase letter or digit",
      },
      {
        path: "a" + "b".repeat(62) + "c.api",
        error: "Path is invalid: Path segment cannot exceed 63 characters",
      }, // 64 char segment
    ],
  };

  describe("validateNamespacePath", () => {
    it.each(testCases.valid)(
      "should return Ok result for valid path '$path'",
      ({ path, segments }) => {
        const [error, result] = validateNamespacePath(path);
        expect(error).toBeUndefined();
        expect(result).toEqual(segments);
      },
    );

    it.each(testCases.invalid)(
      "should return Err result '$error' for invalid path '$path'",
      ({ path, error }) => {
        const [err, result] = validateNamespacePath(path);
        expect(err).toBe(error);
        expect(result).toBeUndefined();
      },
    );
  });

  describe("isValidNamespacePath", () => {
    it.each(testCases.valid)(
      "should return true for valid path '$path'",
      ({ path }) => {
        expect(isValidNamespacePath(path)).toBe(true);
      },
    );

    it.each(testCases.invalid)(
      "should return false for invalid path '$path'",
      ({ path }) => {
        expect(isValidNamespacePath(path)).toBe(false);
      },
    );
  });

  describe("namespacePathParser", () => {
    const schema = namespacePathParser();

    it.each(testCases.valid)(
      "should validate valid path '$path'",
      ({ path }) => {
        expect(schema.safeParse(path).success).toBe(true);
      },
    );

    it.each(testCases.invalid)(
      "should reject invalid path '$path' with error '$error'",
      ({ path, error }) => {
        const result = schema.safeParse(path);
        expect(result.success).toBe(false);
        if (!result.success && result.error.issues[0]) {
          expect(result.error.issues[0].message).toBe(error);
        }
      },
    );
  });
});
