import { describe, expect, it } from "vitest";

import { checkSS58 } from "../address.js";
import { generateRootStreamId } from "./permission0.js";

describe("permission0", () => {
  describe("generateRootStreamId", () => {
    it("should generate the correct root stream ID for a given agent ID", () => {
      const agentId = checkSS58(
        "5Fk3whq9Fr7yhMfXVMuokMprdPn3PMwkBDGcTG9Cc5m3GMgk",
      );
      const expectedStreamId =
        "0x1b4da0b134a147e984255a535c45973a94651814b059476fb632a385fa6c02fc";

      const result = generateRootStreamId(agentId);

      expect(result).toBe(expectedStreamId);
    });
  });
});
