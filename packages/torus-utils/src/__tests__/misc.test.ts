import { describe, expect, it } from "vitest";
import { memo, once } from "../misc.js";

describe("once", () => {
  it("should return true on first call to isFirst()", () => {
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

describe("memo", () => {
  it("should only execute the function once", () => {
    let callCount = 0;
    const fn = memo(() => {
      callCount++;
      return "result";
    });

    expect(callCount).toBe(0); // Not called yet

    fn();
    expect(callCount).toBe(1);

    fn();
    fn();
    fn();
    expect(callCount).toBe(1); // Still only called once
  });

  it("should return the cached result on subsequent calls", () => {
    const fn = memo(() => ({ id: Math.random(), data: "test" }));

    const result1 = fn();
    const result2 = fn();
    const result3 = fn();

    expect(result1).toBe(result2); // Same reference
    expect(result2).toBe(result3); // Same reference
    expect(result1.id).toBe(result2.id); // Same value
  });

  it("should work with different return types", () => {
    const stringMemo = memo(() => "hello");
    const numberMemo = memo(() => 42);
    const objectMemo = memo(() => ({ key: "value" }));
    const arrayMemo = memo(() => [1, 2, 3]);
    const nullMemo = memo(() => null);
    const undefinedMemo = memo(() => undefined);

    expect(stringMemo()).toBe("hello");
    expect(stringMemo()).toBe("hello");

    expect(numberMemo()).toBe(42);
    expect(numberMemo()).toBe(42);

    const obj1 = objectMemo();
    const obj2 = objectMemo();
    expect(obj1).toBe(obj2);
    expect(obj1.key).toBe("value");

    const arr1 = arrayMemo();
    const arr2 = arrayMemo();
    expect(arr1).toBe(arr2);
    expect(arr1).toEqual([1, 2, 3]);

    expect(nullMemo()).toBe(null);
    expect(nullMemo()).toBe(null);

    expect(undefinedMemo()).toBe(undefined);
    expect(undefinedMemo()).toBe(undefined);
  });

  it("should cache side effects", () => {
    let sideEffectCount = 0;
    const sideEffectData: string[] = [];

    const fn = memo(() => {
      sideEffectCount++;
      sideEffectData.push("executed");
      return `execution-${sideEffectCount}`;
    });

    const result1 = fn();
    expect(result1).toBe("execution-1");
    expect(sideEffectCount).toBe(1);
    expect(sideEffectData).toEqual(["executed"]);

    const result2 = fn();
    expect(result2).toBe("execution-1"); // Same cached result
    expect(sideEffectCount).toBe(1); // Side effect not repeated
    expect(sideEffectData).toEqual(["executed"]); // No additional side effects
  });

  it("should work independently for multiple memoized functions", () => {
    let count1 = 0;
    let count2 = 0;

    const fn1 = memo(() => {
      count1++;
      return `fn1-${count1}`;
    });

    const fn2 = memo(() => {
      count2++;
      return `fn2-${count2}`;
    });

    expect(fn1()).toBe("fn1-1");
    expect(fn2()).toBe("fn2-1");

    expect(fn1()).toBe("fn1-1"); // Cached
    expect(fn2()).toBe("fn2-1"); // Cached

    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  it("should not cache errors and retry on subsequent calls", () => {
    let throwCount = 0;
    const error = new Error("Test error");

    const fn = memo(() => {
      throwCount++;
      throw error;
    });

    expect(() => fn()).toThrow("Test error");
    expect(throwCount).toBe(1);

    expect(() => fn()).toThrow("Test error"); // Function retries since error wasn't cached
    expect(throwCount).toBe(2); // Function executes again after error

    expect(() => fn()).toThrow("Test error"); // Function retries again
    expect(throwCount).toBe(3); // Function executes again after error
  });

  it("should implement lazy evaluation", () => {
    let evaluated = false;

    const fn = memo(() => {
      evaluated = true;
      return "lazy-result";
    });

    expect(evaluated).toBe(false); // Should not be evaluated yet

    const result = fn();
    expect(evaluated).toBe(true);
    expect(result).toBe("lazy-result");
  });

  it("should be useful for expensive computations", () => {
    let computationCount = 0;

    const expensiveComputation = memo(() => {
      computationCount++;
      // Simulate expensive computation
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += i;
      }
      return result;
    });

    const result1 = expensiveComputation();
    const result2 = expensiveComputation();
    const result3 = expensiveComputation();

    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
    expect(result1).toBe(499500); // Sum of 0 to 999
    expect(computationCount).toBe(1); // Computation only done once
  });

  it("should be useful for configuration loading pattern", () => {
    let loadCount = 0;

    const getConfig = memo(() => {
      loadCount++;
      console.log("Loading config..."); // This would be visible in real usage
      return { apiUrl: "https://api.example.com", timeout: 5000 };
    });

    const config1 = getConfig();
    const config2 = getConfig();
    const config3 = getConfig();

    expect(config1).toBe(config2); // Same object reference
    expect(config2).toBe(config3); // Same object reference
    expect(config1.apiUrl).toBe("https://api.example.com");
    expect(config1.timeout).toBe(5000);
    expect(loadCount).toBe(1); // Config only loaded once
  });
});
