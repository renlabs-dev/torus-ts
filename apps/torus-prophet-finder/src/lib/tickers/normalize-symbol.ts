export function normalizeSymbol(input: string): string {
  let s = input.trim();
  // strip leading $ if present
  s = s.replace(/^\$+/, "");
  // remove everything except letters/numbers
  s = s.replace(/[^a-zA-Z0-9]/g, "");
  // upper-case final symbol
  return s.toUpperCase();
}

