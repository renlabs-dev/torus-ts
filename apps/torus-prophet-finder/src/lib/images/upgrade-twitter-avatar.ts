/**
 * Upgrade a Twitter/X avatar URL to a higher resolution when possible.
 *
 * Examples:
 * - https://pbs.twimg.com/profile_images/.../foo_normal.jpg  -> _400x400.jpg
 * - https://pbs.twimg.com/profile_images/.../foo_bigger.png  -> _400x400.png
 * - Otherwise returns the original URL unchanged.
 */
export function upgradeTwitterAvatarUrl(src: string): string {
  try {
    const u = new URL(src);
    if (u.hostname !== "pbs.twimg.com") return src;
    const m = u.pathname.match(/^(.*)_(normal|bigger|mini)(\.[a-zA-Z0-9]+)$/);
    if (m) {
      const [, base, , ext] = m;
      const newPath = `${base}_400x400${ext}`;
      return `${u.origin}${newPath}`;
    }
    return src;
  } catch {
    return src;
  }
}
