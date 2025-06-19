export const isPromise = (value: unknown): value is Promise<unknown> =>
  Boolean(
    value &&
      typeof value === "object" &&
      "then" in value &&
      typeof value.then === "function",
  );
