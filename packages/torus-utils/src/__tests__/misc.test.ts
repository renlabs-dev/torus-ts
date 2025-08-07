import { describe, expect, it } from "vitest";

import { once } from "../misc.js";

describe("once", () => {
  it("should return false on first call to isFirst()", () => {
    const o = once();
    expect(o.isFirst()).toBe(true);
  });

  it("should return false on subsequent calls to isFirst()", () => {
    const o = once();
    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);
    expect(o.isFirst()).toBe(false);
    expect(o.isFirst()).toBe(false);
  });

  it("should allow resetting the state", () => {
    const o = once();
    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);

    o.reset();
    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);
  });

  it("should handle multiple reset cycles", () => {
    const o = once();

    // First cycle
    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);

    // Reset and second cycle
    o.reset();
    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);

    // Reset and third cycle
    o.reset();
    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);
  });

  it("should work independently for multiple instances", () => {
    const o1 = once();
    const o2 = once();

    expect(o1.isFirst()).toBe(true);
    expect(o2.isFirst()).toBe(true);

    expect(o1.isFirst()).toBe(false);
    expect(o2.isFirst()).toBe(false);

    o1.reset();
    expect(o1.isFirst()).toBe(true);
    expect(o2.isFirst()).toBe(false); // o2 should not be affected
  });

  it("should handle reset without prior isFirst() call", () => {
    const o = once();
    o.reset();
    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);
  });

  it("should handle multiple consecutive resets", () => {
    const o = once();
    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);

    o.reset();
    o.reset();
    o.reset();

    expect(o.isFirst()).toBe(true);
    expect(o.isFirst()).toBe(false);
  });

  it("should be useful for one-time initialization patterns", () => {
    const o = once();
    let initCount = 0;

    const initialize = () => {
      if (o.isFirst()) {
        initCount++;
      }
    };

    initialize();
    initialize();
    initialize();

    expect(initCount).toBe(1);

    o.reset();
    initialize();

    expect(initCount).toBe(2);
  });

  it("should work with short-circuit evaluation", () => {
    const o = once();
    let sideEffectCount = 0;

    const sideEffect = () => {
      sideEffectCount++;
      return true;
    };

    // First call - both isFirst() and sideEffect() should execute
    if (o.isFirst() && sideEffect()) {
      expect(sideEffectCount).toBe(1);
    }

    // Second call - isFirst() returns false, sideEffect() should not execute
    if (o.isFirst() && sideEffect()) {
      // This block should not execute
      expect(true).toBe(false);
    }

    expect(sideEffectCount).toBe(1); // sideEffect only called once
  });
});
