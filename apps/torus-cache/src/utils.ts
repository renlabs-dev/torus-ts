export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// wait for something, checking if it's ready every interval ms, until maxTime ms have passed
export const waitFor = async (
  awaiter: string,
  resourceName: string,
  interval: number,
  maxTime: number,
  isReady: () => boolean,
  verbose: boolean,
) => {
  let totalTime = 0;
  while (totalTime < maxTime && !isReady()) {
    if (verbose)
      console.log(
        `${awaiter} is waiting for ${resourceName} for ${totalTime / 1000}s`,
      );
    await sleep(interval);
    totalTime += interval;
  }
};

export function log(msg: unknown, ...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
}
