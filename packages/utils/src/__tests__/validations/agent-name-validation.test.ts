import { describe, expect, it } from "vitest";
import {
  validateAgentName,
  isValidAgentName,
  agentNameField,
  optionalAgentNameField,
  readOnlyAgentNameField,
  AGENT_NAME_REGEX,
} from "../../validations/agent-name-validation";

describe("agent name validation", () => {
  // Test cases from the requirements
  const validTests = [
    "a",
    "9",
    "test",
    "api-v2",
    "user_name1",
    "db-prod-01",
    "my_test_123",
    "snake_case1",
    "kebab-case2",
  ];

  const invalidTests = [
    "-test", // starts with hyphen
    "_test", // starts with underscore
    "+test", // invalid character
    "test-", // ends with hyphen
    "test_", // ends with underscore
    "test+", // invalid character
    "a_", // ends with underscore
    "99-", // ends with hyphen
    "Test1", // uppercase
    "UPPER1", // uppercase
    "user@host1", // invalid character
    "hello world1", // space
    "path/to/file1", // invalid characters
    "price$99", // invalid character
    "item#1", // invalid character
    "user.name1", // invalid character
    "", // empty
    "a123456789012345678901234567890123456789012345678901234567890123", // 64 chars
  ];

  describe("validateAgentName", () => {
    it("should return null for valid agent names", () => {
      validTests.forEach((test) => {
        const result = validateAgentName(test);
        expect(result).toBeNull();
      });
    });

    it("should return error message for invalid agent names", () => {
      invalidTests.forEach((test) => {
        const result = validateAgentName(test);
        expect(result).not.toBeNull();
        expect(typeof result).toBe("string");
        expect(result!.length).toBeGreaterThan(0);
      });
    });

    it("should return specific error for empty string", () => {
      const result = validateAgentName("");
      expect(result).toBe("Agent name is required");
    });

    it("should return specific error for names longer than 63 characters", () => {
      const longName = "a" + "b".repeat(62) + "c";
      expect(longName.length).toBe(64);
      const result = validateAgentName(longName);
      expect(result).toBe("Agent name cannot exceed 63 characters");
    });

    it("should return specific error for names starting with hyphen", () => {
      const result = validateAgentName("-test");
      expect(result).toBe(
        "Agent name cannot start with a hyphen or underscore",
      );
    });

    it("should return specific error for names starting with underscore", () => {
      const result = validateAgentName("_test");
      expect(result).toBe(
        "Agent name cannot start with a hyphen or underscore",
      );
    });

    it("should return specific error for names ending with hyphen", () => {
      const result = validateAgentName("test-");
      expect(result).toBe("Agent name cannot end with a hyphen or underscore");
    });

    it("should return specific error for names ending with underscore", () => {
      const result = validateAgentName("test_");
      expect(result).toBe("Agent name cannot end with a hyphen or underscore");
    });

    it("should return specific error for names with uppercase letters", () => {
      const result = validateAgentName("Test1");
      expect(result).toBe("Agent name cannot contain uppercase letters");
    });

    it("should return specific error for names with invalid characters", () => {
      const result = validateAgentName("user@host1");
      expect(result).toBe(
        "Agent name can only contain lowercase letters, numbers, hyphens, and underscores",
      );
    });
  });

  describe("isValidAgentName", () => {
    it("should return true for valid agent names", () => {
      validTests.forEach((test) => {
        const result = isValidAgentName(test);
        expect(result).toBe(true);
      });
    });

    it("should return false for invalid agent names", () => {
      invalidTests.forEach((test) => {
        const result = isValidAgentName(test);
        expect(result).toBe(false);
      });
    });

    it("should return false for empty string", () => {
      const result = isValidAgentName("");
      expect(result).toBe(false);
    });
  });

  describe("AGENT_NAME_REGEX", () => {
    it("should match valid agent names", () => {
      validTests.forEach((test) => {
        const result = AGENT_NAME_REGEX.test(test);
        expect(result).toBe(true);
      });
    });

    it("should not match invalid agent names", () => {
      invalidTests.forEach((test) => {
        const result = AGENT_NAME_REGEX.test(test);
        expect(result).toBe(false);
      });
    });
  });

  describe("agentNameField", () => {
    it("should validate valid agent names", () => {
      const schema = agentNameField();

      validTests.forEach((test) => {
        const result = schema.safeParse(test);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid agent names", () => {
      const schema = agentNameField();

      invalidTests.forEach((test) => {
        const result = schema.safeParse(test);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBeTruthy();
        }
      });
    });

    it("should reject empty string", () => {
      const schema = agentNameField();
      const result = schema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Agent name is required");
      }
    });
  });

  describe("optionalAgentNameField", () => {
    it("should accept valid agent names", () => {
      const schema = optionalAgentNameField();

      validTests.forEach((test) => {
        const result = schema.safeParse(test);
        expect(result.success).toBe(true);
      });
    });

    it("should accept undefined", () => {
      const schema = optionalAgentNameField();
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should reject invalid agent names", () => {
      const schema = optionalAgentNameField();

      invalidTests.forEach((test) => {
        const result = schema.safeParse(test);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBeTruthy();
        }
      });
    });
  });

  describe("readOnlyAgentNameField", () => {
    it("should accept any string", () => {
      const schema = readOnlyAgentNameField();

      const testCases = ["valid-name", "invalid@name", "UPPERCASE", "", "test"];
      testCases.forEach((test) => {
        const result = schema.safeParse(test);
        expect(result.success).toBe(true);
      });
    });

    it("should accept undefined", () => {
      const schema = readOnlyAgentNameField();
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should trim whitespace", () => {
      const schema = readOnlyAgentNameField();
      const result = schema.safeParse("  test  ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test");
      }
    });
  });

  describe("edge cases", () => {
    it("should accept single character names", () => {
      expect(isValidAgentName("a")).toBe(true);
      expect(isValidAgentName("1")).toBe(true);
    });

    it("should accept 63 character names", () => {
      const longName = "a" + "b".repeat(61) + "c";
      expect(longName.length).toBe(63);
      expect(isValidAgentName(longName)).toBe(true);
    });

    it("should reject 64 character names", () => {
      const tooLongName = "a" + "b".repeat(62) + "c";
      expect(tooLongName.length).toBe(64);
      expect(isValidAgentName(tooLongName)).toBe(false);
    });

    it("should handle names with mixed valid characters", () => {
      const mixedName = "a1-b2_c3";
      expect(isValidAgentName(mixedName)).toBe(true);
    });

    it("should handle names with only numbers", () => {
      expect(isValidAgentName("123")).toBe(true);
      expect(isValidAgentName("1")).toBe(true);
    });

    it("should handle names with only letters", () => {
      expect(isValidAgentName("abc")).toBe(true);
      expect(isValidAgentName("a")).toBe(true);
    });
  });
});
