import { describe, expect, it } from "vitest";

import { AsyncPushStream, defer } from "../async.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("defer", () => {
  it("should create a deferred promise", () => {
    const deferred = defer<string>();

    expect(deferred).toHaveProperty("promise");
    expect(deferred).toHaveProperty("resolve");
    expect(deferred).toHaveProperty("reject");
    expect(deferred.promise).toBeInstanceOf(Promise);
  });

  it("should resolve the promise with the provided value", async () => {
    const deferred = defer<string>();

    setTimeout(() => deferred.resolve("test value"), 10);

    const result = await deferred.promise;
    expect(result).toBe("test value");
  });

  it("should reject the promise with the provided error", async () => {
    const deferred = defer<string>();
    const error = new Error("test error");

    setTimeout(() => deferred.reject(error), 10);

    await expect(deferred.promise).rejects.toThrow("test error");
  });

  it("should handle synchronous resolution", async () => {
    const deferred = defer<number>();

    deferred.resolve(42);

    const result = await deferred.promise;
    expect(result).toBe(42);
  });

  it("should handle synchronous rejection", async () => {
    const deferred = defer<string>();

    deferred.reject(new Error("sync error"));

    await expect(deferred.promise).rejects.toThrow("sync error");
  });

  it("should work with complex types", async () => {
    interface User {
      id: number;
      name: string;
    }

    const deferred = defer<User>();
    const user: User = { id: 1, name: "Alice" };

    deferred.resolve(user);

    const result = await deferred.promise;
    expect(result).toEqual(user);
  });

  it("should allow promise chaining", async () => {
    const deferred = defer<number>();

    const chainedPromise = deferred.promise
      .then((n) => n * 2)
      .then((n) => n + 10);

    deferred.resolve(5);

    const result = await chainedPromise;
    expect(result).toBe(20);
  });

  it("should work with Promise.all", async () => {
    const deferred1 = defer<string>();
    const deferred2 = defer<number>();
    const deferred3 = defer<boolean>();

    const allPromise = Promise.all([
      deferred1.promise,
      deferred2.promise,
      deferred3.promise,
    ]);

    deferred1.resolve("hello");
    deferred2.resolve(123);
    deferred3.resolve(true);

    const results = await allPromise;
    expect(results).toEqual(["hello", 123, true]);
  });

  it("should work with Promise.race", async () => {
    const deferred1 = defer<string>();
    const deferred2 = defer<string>();

    const racePromise = Promise.race([deferred1.promise, deferred2.promise]);

    deferred2.resolve("second");
    deferred1.resolve("first");

    const result = await racePromise;
    expect(result).toBe("second");
  });

  it("should handle async/await patterns", async () => {
    const deferred = defer<string>();

    const asyncFunction = async () => {
      const value = await deferred.promise;
      return `Received: ${value}`;
    };

    const resultPromise = asyncFunction();

    deferred.resolve("test");

    const result = await resultPromise;
    expect(result).toBe("Received: test");
  });

  it("should handle rejection in try-catch", async () => {
    const deferred = defer<string>();

    const asyncFunction = async () => {
      try {
        await deferred.promise;
        return "success";
      } catch (error) {
        return "caught error";
      }
    };

    const resultPromise = asyncFunction();

    deferred.reject(new Error("test error"));

    const result = await resultPromise;
    expect(result).toBe("caught error");
  });

  it("should only resolve/reject once", async () => {
    const deferred = defer<number>();

    deferred.resolve(1);
    deferred.resolve(2); // This should have no effect
    deferred.reject(new Error("error")); // This should have no effect

    const result = await deferred.promise;
    expect(result).toBe(1);
  });

  it("should work with void type", async () => {
    const deferred = defer<void>();

    let executed = false;
    void deferred.promise.then(() => {
      executed = true;
    });

    deferred.resolve();

    await deferred.promise;
    expect(executed).toBe(true);
  });

  it("should handle rejection with non-Error values", async () => {
    const deferred = defer<string>();

    deferred.reject("string rejection");

    try {
      await deferred.promise;
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBe("string rejection");
    }
  });

  it("should allow attaching handlers after resolution", async () => {
    const deferred = defer<string>();

    deferred.resolve("value");

    // Attach handler after resolution
    const result = await deferred.promise.then((v) => `Got: ${v}`);
    expect(result).toBe("Got: value");
  });
});

describe("AsyncPushStream", () => {
  it("should create a stream instance", () => {
    const stream = new AsyncPushStream<number>();
    expect(stream).toBeInstanceOf(AsyncPushStream);
    expect(stream.isFinished).toBe(false);
  });

  it("should push and consume values in order", async () => {
    const stream = new AsyncPushStream<number>();

    stream.push(1);
    stream.push(2);
    stream.push(3);

    const results: number[] = [];
    const consumer = (async () => {
      for await (const value of stream) {
        results.push(value);
      }
    })();

    // Wait a bit then end the stream
    await sleep(10);
    stream.end();

    await consumer;
    expect(results).toEqual([1, 2, 3]);
  });

  it("should handle async consumption with delays", async () => {
    const stream = new AsyncPushStream<string>();

    // Push values asynchronously
    setTimeout(() => stream.push("first"), 10);
    setTimeout(() => stream.push("second"), 20);
    setTimeout(() => stream.push("third"), 30);
    setTimeout(() => stream.end(), 40);

    const results: string[] = [];
    for await (const value of stream) {
      results.push(value);
    }

    expect(results).toEqual(["first", "second", "third"]);
  });

  it("should handle immediate consumption when values are buffered", async () => {
    const stream = new AsyncPushStream<number>();

    // Buffer values before consumption
    stream.push(10);
    stream.push(20);
    stream.push(30);

    // Consume one value
    const result1 = await stream.next();
    expect(result1).toEqual({ value: 10, done: false });

    // Push more while consuming
    stream.push(40);

    const result2 = await stream.next();
    expect(result2).toEqual({ value: 20, done: false });

    const result3 = await stream.next();
    expect(result3).toEqual({ value: 30, done: false });

    const result4 = await stream.next();
    expect(result4).toEqual({ value: 40, done: false });

    stream.end();

    const result5 = await stream.next();
    expect(result5).toEqual({ value: undefined, done: true });
  });

  it("should handle backpressure correctly", async () => {
    const stream = new AsyncPushStream<number>();
    const consumed: number[] = [];

    // Start slow consumer
    const consumer = (async () => {
      for await (const value of stream) {
        consumed.push(value);
        // Simulate slow processing
        await sleep(5);
      }
    })();

    // Fast producer - push values with small delays to ensure consumer can process
    for (let i = 0; i < 5; i++) {
      stream.push(i);
      await sleep(2);
    }

    // Wait before ending to ensure all values are consumed
    await sleep(20);
    stream.end();

    await consumer;
    expect(consumed).toEqual([0, 1, 2, 3, 4]);
  });

  it("should return error when pushing after end", () => {
    const stream = new AsyncPushStream<string>();

    stream.push("valid");
    stream.end();

    const result = stream.push("invalid");
    // Result is a tuple: [error, value]
    expect(result[0]).toBeInstanceOf(Error);
    expect(result[0]?.message).toBe("Cannot push after stream has ended");
    expect(result[1]).toBeUndefined();
  });

  it("should handle early return correctly", async () => {
    const stream = new AsyncPushStream<number>();

    stream.push(1);
    stream.push(2);
    stream.push(3);

    const result1 = await stream.next();
    expect(result1).toEqual({ value: 1, done: false });

    // Early return
    const returnResult = await stream.return();
    expect(returnResult).toEqual({ value: undefined, done: true });
    expect(stream.isFinished).toBe(true);

    // After return, the stream is ended and buffer is cleared
    const result2 = await stream.next();
    expect(result2).toEqual({ value: undefined, done: true });
  });

  it("should handle multiple end calls gracefully", () => {
    const stream = new AsyncPushStream<string>();

    stream.push("test");
    stream.end();
    stream.end(); // Second call should be safe

    expect(stream.isFinished).toBe(true);
  });

  it("should work with complex types", async () => {
    interface Event {
      type: string;
      timestamp: number;
      data?: unknown;
    }

    const stream = new AsyncPushStream<Event>();

    const events: Event[] = [];
    const consumer = (async () => {
      for await (const event of stream) {
        events.push(event);
      }
    })();

    stream.push({ type: "start", timestamp: Date.now() });
    stream.push({ type: "data", timestamp: Date.now(), data: { value: 42 } });
    stream.push({ type: "end", timestamp: Date.now() });

    // Wait to ensure consumer processes all events
    await sleep(10);
    stream.end();

    await consumer;

    expect(events).toHaveLength(3);
    expect(events[0]?.type).toBe("start");
    expect(events[1]?.type).toBe("data");
    expect(events[2]?.type).toBe("end");
  });

  it("should handle concurrent consumers correctly", async () => {
    const stream = new AsyncPushStream<number>();

    // Push some initial values
    stream.push(1);
    stream.push(2);

    // First consumer gets first value
    const result1 = await stream.next();
    expect(result1.value).toBe(1);

    // Second consumer gets second value
    const result2 = await stream.next();
    expect(result2.value).toBe(2);

    // Both waiting for next value
    const promise1 = stream.next();
    const promise2 = stream.next();

    // Push two more values
    stream.push(3);
    stream.push(4);

    // Each promise gets one value
    const [res1, res2] = await Promise.all([promise1, promise2]);
    expect([res1.value, res2.value].sort()).toEqual([3, 4]);

    stream.end();
  });

  it("should handle async iteration with break", async () => {
    const stream = new AsyncPushStream<number>();

    stream.push(1);
    stream.push(2);
    stream.push(3);
    stream.push(4);
    stream.push(5);

    const results: number[] = [];
    for await (const value of stream) {
      results.push(value);
      if (value === 3) {
        break; // Early exit - this calls iterator.return()
      }
    }

    expect(results).toEqual([1, 2, 3]);

    // After break, the stream is closed via return()
    expect(stream.isFinished).toBe(true);

    // Further next() calls should return done
    const next = await stream.next();
    expect(next).toEqual({ value: undefined, done: true });

    // Push should error or no-op after stream is closed
    const pushResult = stream.push(6);
    expect(pushResult[0]).toBeInstanceOf(Error);
    expect(pushResult[0]?.message).toBe("Cannot push after stream has ended");
  });

  it("should handle async iteration with continue", async () => {
    const stream = new AsyncPushStream<number>();

    const results: number[] = [];
    const consumer = (async () => {
      for await (const value of stream) {
        if (value === 2) {
          continue; // Skip 2
        }
        results.push(value);
      }
    })();

    // Push values after consumer starts
    await sleep(10);
    stream.push(1);
    stream.push(2);
    stream.push(3);
    stream.push(4);

    // Wait to ensure consumer processes all values
    await sleep(10);
    stream.end();

    await consumer;
    expect(results).toEqual([1, 3, 4]);
  });

  it("should handle producer faster than consumer", async () => {
    const stream = new AsyncPushStream<number>();

    // Slow consumer
    const results: number[] = [];
    const consumer = (async () => {
      for await (const value of stream) {
        await sleep(2);
        results.push(value);
      }
    })();

    // Fast producer - push all values immediately
    await sleep(5); // Let consumer start
    for (let i = 0; i < 10; i++) {
      stream.push(i);
    }

    // Wait for consumer to process all values
    await sleep(30);
    stream.end();

    await consumer;
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("should handle consumer faster than producer", async () => {
    const stream = new AsyncPushStream<string>();
    const results: string[] = [];

    // Start fast consumer
    const consumer = (async () => {
      for await (const value of stream) {
        results.push(value);
      }
    })();

    // Slow producer
    await sleep(10);
    stream.push("a");
    await sleep(10);
    stream.push("b");
    await sleep(10);
    stream.push("c");
    stream.end();

    await consumer;
    expect(results).toEqual(["a", "b", "c"]);
  });

  it("should properly clean up on end", async () => {
    const stream = new AsyncPushStream<number>();

    // Create multiple waiting consumers
    const promises = [stream.next(), stream.next(), stream.next()];

    // End the stream
    stream.end();

    // All promises should resolve with done
    const results = await Promise.all(promises);
    for (const result of results) {
      expect(result).toEqual({ value: undefined, done: true });
    }
  });

  it("should work with Symbol.asyncIterator", async () => {
    const stream = new AsyncPushStream<string>();

    stream.push("hello");
    stream.push("world");

    const iterator = stream[Symbol.asyncIterator]();
    expect(iterator).toBe(stream); // Should return itself

    const result1 = await iterator.next();
    expect(result1).toEqual({ value: "hello", done: false });

    const result2 = await iterator.next();
    expect(result2).toEqual({ value: "world", done: false });

    stream.end();

    const result3 = await iterator.next();
    expect(result3).toEqual({ value: undefined, done: true });
  });

  it("should handle empty stream", async () => {
    const stream = new AsyncPushStream<number>();
    stream.end();

    const results: number[] = [];
    for await (const value of stream) {
      results.push(value);
    }

    expect(results).toEqual([]);
  });

  it("should handle single value stream", async () => {
    const stream = new AsyncPushStream<boolean>();

    const results: boolean[] = [];
    const consumer = (async () => {
      for await (const value of stream) {
        results.push(value);
      }
    })();

    stream.push(true);

    // Wait to ensure consumer processes the value
    await sleep(10);
    stream.end();

    await consumer;
    expect(results).toEqual([true]);
  });

  it("supports undefined values", async () => {
    const s = new AsyncPushStream<undefined | number>();
    const p1 = s.next();
    const p2 = s.next();
    s.push(undefined);
    s.push(42);
    expect(await p1).toEqual({ value: undefined, done: false });
    expect(await p2).toEqual({ value: 42, done: false });
    s.end();
    expect(await s.next()).toEqual({ value: undefined, done: true });
  });

  it("resolves mixed buffered and pending on end()", async () => {
    const s = new AsyncPushStream<number>();
    s.push(7);
    const p1 = s.next(); // gets 1 immediately
    const p2 = s.next(); // waits
    s.end();
    expect(await p1).toEqual({ value: 7, done: false });
    expect(await p2).toEqual({ value: undefined, done: true });
  });

  it("handles reentrant push from consumer", async () => {
    const s = new AsyncPushStream<number>();
    const out: number[] = [];
    void (async () => {
      for await (const v of s) {
        out.push(v);
        if (v === 1) s.push(2);
      }
    })();
    s.push(1);
    await sleep(0);
    expect(out).toEqual([1, 2]);
  });
});
