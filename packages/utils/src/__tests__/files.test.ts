import { describe, expect, it } from "vitest";
import { smallFilename } from "../files.js";

describe("smallFilename", () => {
  it("should shorten filenames consistently across calls", () => {
    // Call once to potentially mutate regex state if it were global
    const first = smallFilename("other.txt", 7);
    expect(first).toBe("ot…r.txt");

    // Second call should not be affected by the first call
    const second = smallFilename("fooobar.png", 8);
    expect(second).toBe("fo…r.png");
  });

  it("should return the original name when under the limit", () => {
    const result = smallFilename("short.txt", 20);
    expect(result).toBe("short.txt");
  });

  it("should preserve the extension when truncating", () => {
    const result = smallFilename("verylongfilename.txt", 10);
    expect(result).toBe("ver…me.txt");
  });

  it("should work with names without an extension", () => {
    const result = smallFilename("verylongfilename", 8);
    expect(result).toBe("very…ame");
  });

  it("should handle non positive lengths", () => {
    expect(smallFilename("foo.txt", -5)).toBe("fo…o.txt");
    expect(smallFilename("foo.txt", 0)).toBe("fo…o.txt");
  });

  it("should handle long extensions", () => {
    const result = smallFilename("longextension.jpeg", 8);
    expect(result).toBe("lo…n.jpeg");
  });
});
