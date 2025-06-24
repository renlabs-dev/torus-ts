import { describe, expect, it } from "vitest";
import {
  validateNamespaceSegment,
  isValidNamespaceSegment,
  namespaceSegmentField,
  NAMESPACE_SEGMENT_REGEX,
} from "../../validations/namespace-validation.js";

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
        error: "Namespace segment must start with a lowercase letter or digit",
      },
      {
        value: "_test",
        error: "Namespace segment must start with a lowercase letter or digit",
      },
      {
        value: "+test",
        error: "Namespace segment must start with a lowercase letter or digit",
      },
      {
        value: "test-",
        error: "Namespace segment must end with a lowercase letter or digit",
      },
      {
        value: "test_",
        error: "Namespace segment must end with a lowercase letter or digit",
      },
      {
        value: "test+",
        error: "Namespace segment must end with a lowercase letter or digit",
      },
      {
        value: "Test1",
        error: "Namespace segment cannot contain uppercase letters",
      },
      {
        value: "user@host1",
        error:
          "Namespace segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
      },
      { value: "", error: "Namespace segment is required" },
      {
        value: "a" + "b".repeat(62) + "c",
        error: "Namespace segment cannot exceed 63 characters",
      }, // 64 chars
      {
        value: "hello world1",
        error:
          "Namespace segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
      },
      {
        value: "test*segment",
        error:
          "Namespace segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
      },
    ],
  };

  describe("validateNamespaceSegment", () => {
    it.each(testCases.valid)(
      "should return null for valid segment '%s'",
      (segment) => {
        expect(validateNamespaceSegment(segment)).toBeNull();
      },
    );

    it.each(testCases.invalid)(
      "should return error '$error' for invalid segment '$value'",
      ({ value, error }) => {
        expect(validateNamespaceSegment(value)).toBe(error);
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
