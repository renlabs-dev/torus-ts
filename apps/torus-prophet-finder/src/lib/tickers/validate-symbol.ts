import { normalizeSymbol } from "./normalize-symbol";

export function validateTickerInput(input: string): {
  symbol: string | null;
  error?: string;
} {
  const original = input.trim();
  const symbol = normalizeSymbol(original);

  if (symbol.length === 0) {
    return { symbol: null, error: "Please enter a valid ticker (e.g., $BTC)" };
  }
  // Must be 1–10 chars and uppercase letters/digits only; start with a letter
  if (symbol.length > 10) {
    return { symbol: null, error: "Ticker must be 1–10 characters" };
  }
  if (!/^[A-Z][A-Z0-9]*$/.test(symbol)) {
    return {
      symbol: null,
      error: "Ticker must start with a letter and use A–Z/0–9",
    };
  }
  // Avoid purely numeric symbols
  if (/^[0-9]+$/.test(symbol)) {
    return { symbol: null, error: "Ticker cannot be only numbers" };
  }
  // Optional: avoid extremely short symbols (heuristic)
  if (symbol.length < 2) {
    return { symbol: null, error: "Ticker must be at least 2 characters" };
  }

  return { symbol };
}
