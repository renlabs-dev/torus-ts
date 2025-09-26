export function validateHandleInput(input: string): {
  core: string | null;
  error?: string;
} {
  const original = input.trim();
  if (original.length === 0)
    return { core: null, error: "Please enter an @username or profile URL" };

  // Normalize common URL prefixes and extract the first path segment (the handle)
  let work = original;
  const urlPrefix = /^(https?:\/\/)(?:www\.|m\.|mobile\.)?(twitter|x)\.com\//i;
  if (urlPrefix.test(work)) {
    work = work.replace(urlPrefix, "");
    // If it's a tweet URL or internal route, hint the right input shape
    if (/\/status\//i.test(original) || /\/i\/user\//i.test(original)) {
      // Still continue to extract a likely handle from first segment, but return a friendly error
      const seg = work.replace(/^\/+/, "").split(/[/?#]/)[0] ?? "";
      const handleCandidate = seg
        .replace(/^@+/, "")
        .replace(/[^a-zA-Z0-9_]/g, "");
      if (handleCandidate.length > 0) {
        return {
          core: null,
          error: "Please enter a profile URL or @username (not a tweet URL)",
        };
      }
    }
    // Take only the first segment as the handle
    work = work.replace(/^\/+/, "").split(/[/?#]/)[0] ?? "";
  }

  // Strip leading @, keep only valid characters
  work = work.replace(/^@+/, "");
  const handle = work.replace(/[^a-zA-Z0-9_]/g, "");

  // Heuristic validations based on Twitter rules: 1–15 chars, letters/numbers/underscore
  if (handle.length === 0) {
    return { core: null, error: "Please enter a valid @username" };
  }
  if (handle.length > 15) {
    return { core: null, error: "Usernames must be 1–15 characters" };
  }
  if (!/^[A-Za-z0-9_]+$/.test(handle)) {
    return { core: null, error: "Only letters, numbers, and _ are allowed" };
  }
  // Avoid all-underscore usernames
  if (/^_+$/.test(handle)) {
    return { core: null, error: "Username must include letters or numbers" };
  }

  return { core: handle };
}
