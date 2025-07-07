import { describe, expect, it } from "vitest";
import {
  validateAgentName,
  isValidAgentName,
  agentNameField,
  AGENT_NAME_REGEX,
} from "../../../types/namespace/agent-name.js";

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
        error: "Agent name must start with a lowercase letter or digit",
      },
      {
        value: "_test",
        error: "Agent name must start with a lowercase letter or digit",
      },
      {
        value: "test-",
        error: "Agent name must end with a lowercase letter or digit",
      },
      {
        value: "test_",
        error: "Agent name must end with a lowercase letter or digit",
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
        error: "Agent name must start with a lowercase letter or digit",
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
      "should return Ok result for valid name '%s'",
      (name) => {
        const [error, result] = validateAgentName(name);
        expect(error).toBeUndefined();
        expect(result).toBe(name);
      },
    );

    it.each(testCases.invalid)(
      "should return Err result '$error' for invalid name '$value'",
      ({ value, error }) => {
        const [err, result] = validateAgentName(value);
        expect(err).toBe(error);
        expect(result).toBeUndefined();
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
});
