import { DateTime } from "luxon";

export function nowISOString(): string {
  return new Date().toISOString();
}

// TODO: refactor block time related functions
// the below two functions are just inverted

export function getExpirationTime(
  blockNumber: number | undefined,
  expirationBlock: number,
  relative = false,
): string {
  if (!blockNumber) return "Unknown";

  const blocksRemaining = expirationBlock - blockNumber;
  const secondsRemaining = blocksRemaining * 8; // 8 seconds per block

  const expirationDate = DateTime.now().plus({ seconds: secondsRemaining });

  if (relative) {
    return expirationDate.toRelative();
  }
  return expirationDate.toLocaleString(DateTime.DATETIME_SHORT);
}

export function getCreationTime(
  blockNumber: number | undefined,
  creationBlock: number,
  relative = false,
) {
  if (!blockNumber) return "Unknown";

  const blocksAgo = blockNumber - creationBlock;
  const secondsPassed = blocksAgo * 8; // 8 seconds per block

  const creationDate = DateTime.now().minus({ seconds: secondsPassed });

  if (relative) {
    return creationDate.toRelative();
  }

  return creationDate.toLocaleString(DateTime.DATETIME_SHORT);
}
