import { z } from "zod";

// Strict, irreducible ticker symbol (no $, no spaces, uppercase only)
export const TickerSymbolSchema = z.string().regex(/^[A-Z][A-Z0-9]{1,9}$/, {
  message:
    "Ticker must be 2–10 chars, uppercase, start with a letter; no spaces or $",
});

export function validateTickerInput(input: string): {
  symbol: string | null;
  error?: string;
} {
  const parsed = TickerSymbolSchema.safeParse(input);
  if (!parsed.success) {
    return {
      symbol: null,
      error: parsed.error.issues[0]?.message ?? "Invalid ticker",
    };
  }
  return { symbol: parsed.data };
}
