export function normalizeHandle(input: string): string {
  let h = input.trim();
  h = h.replace(/^https?:\/\/(?:www\.)?(?:twitter|x)\.com\//i, "");
  h = h.replace(/^@+/, "");
  h = h.replace(/[^a-zA-Z0-9_]/g, "");
  return h;
}
