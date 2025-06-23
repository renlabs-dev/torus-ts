import { describe, expect, it } from "vitest";
import {
  validateAgentName,
  isValidAgentName,
  agentNameField,
  optionalAgentNameField,
  readOnlyAgentNameField,
  AGENT_NAME_REGEX,
} from "../../validations/agent-name-validation";

describe("AgentNameValidation", () => {
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
      "a" + "b".repeat(61) + "c", // 63 chars
    ],
    invalid: [
      {
        value: "-test",
        error: "Agent name cannot start with a hyphen or underscore",
      },
      {
        value: "_test",
        error: "Agent name cannot start with a hyphen or underscore",
      },
      {
        value: "test-",
        error: "Agent name cannot end with a hyphen or underscore",
      },
      {
        value: "test_",
        error: "Agent name cannot end with a hyphen or underscore",
      },
      { value: "Test1", error: "Agent name cannot contain uppercase letters" },
      {
        value: "user@host1",
        error:
          "Agent name can only contain lowercase letters, numbers, hyphens, and underscores",
      },
      { value: "", error: "Agent name is required" },
      {
        value: "a" + "b".repeat(62) + "c",
        error: "Agent name cannot exceed 63 characters",
      }, // 64 chars
      {
        value: "+test",
        error:
          "Agent name can only contain lowercase letters, numbers, hyphens, and underscores",
      },
      {
        value: "hello world1",
        error:
          "Agent name can only contain lowercase letters, numbers, hyphens, and underscores",
      },
    ],
  };

  describe("validateAgentName", () => {
    it.each(testCases.valid)(
      "should return null for valid name '%s'",
      (name) => {
        expect(validateAgentName(name)).toBeNull();
      },
    );

    it.each(testCases.invalid)(
      "should return error '$error' for invalid name '$value'",
      ({ value, error }) => {
        expect(validateAgentName(value)).toBe(error);
      },
    );
  });

  describe("isValidAgentName", () => {
    it.each(testCases.valid)(
      "should return true for valid name '%s'",
      (name) => {
        expect(isValidAgentName(name)).toBe(true);
      },
    );

    it.each(testCases.invalid)(
      "should return false for invalid name '$value'",
      ({ value }) => {
        expect(isValidAgentName(value)).toBe(false);
      },
    );
  });

  describe("AGENT_NAME_REGEX", () => {
    it.each(testCases.valid)("should match valid name '%s'", (name) => {
      expect(AGENT_NAME_REGEX.test(name)).toBe(true);
    });

    it.each(testCases.invalid)(
      "should not match invalid name '$value'",
      ({ value }) => {
        expect(AGENT_NAME_REGEX.test(value)).toBe(false);
      },
    );
  });

  describe("agentNameField", () => {
    const schema = agentNameField();

    it.each(testCases.valid)("should validate valid name '%s'", (name) => {
      expect(schema.safeParse(name).success).toBe(true);
    });

    it.each(testCases.invalid)(
      "should reject invalid name '$value' with error '$error'",
      ({ value, error }) => {
        const result = schema.safeParse(value);
        expect(result.success).toBe(false);
        if (!result.success && result.error.issues[0]) {
          expect(result.error.issues[0].message).toBe(error);
        }
      },
    );
  });

  describe("optionalAgentNameField", () => {
    const schema = optionalAgentNameField();

    it.each(testCases.valid)("should accept valid name '%s'", (name) => {
      expect(schema.safeParse(name).success).toBe(true);
    });

    it("should accept undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it.each(testCases.invalid.filter((tc) => tc.value !== ""))(
      "should reject invalid name '$value' with error '$error'",
      ({ value, error }) => {
        const result = schema.safeParse(value);
        expect(result.success).toBe(false);
        if (!result.success && result.error.issues[0]) {
          expect(result.error.issues[0].message).toBe(error);
        }
      },
    );
  });

  describe("readOnlyAgentNameField", () => {
    const schema = readOnlyAgentNameField();

    it.each([
      "valid-name",
      "invalid@name",
      "UPPERCASE",
      "",
      "test",
      "  test  ",
    ])("should accept any string '%s'", (value) => {
      const result = schema.safeParse(value);
      expect(result.success).toBe(true);
      if (result.success && value.trim() !== "") {
        expect(result.data).toBe(value.trim());
      }
    });

    it("should accept undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(true);
    });
  });
});
