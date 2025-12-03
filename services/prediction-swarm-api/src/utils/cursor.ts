import { z } from "zod";

export const cursorSchema = z.string().transform((cursor, ctx) => {
  const lastUnderscore = cursor.lastIndexOf("_");
  if (lastUnderscore === -1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cursor must be in format: microseconds_tweetId",
    });
    return z.NEVER;
  }

  const timestamp = cursor.substring(0, lastUnderscore);
  const id = cursor.substring(lastUnderscore + 1);

  if (!timestamp || !id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cursor must be in format: microseconds_tweetId",
    });
    return z.NEVER;
  }

  try {
    return {
      createdAt: Number(timestamp),
      id: BigInt(id),
    };
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid microseconds or tweet ID in cursor",
    });
    return z.NEVER;
  }
});

export function encodeCursor(tweet: {
  createdAt: number;
  id: bigint | string;
}): string {
  return `${tweet.createdAt}_${tweet.id}`;
}
