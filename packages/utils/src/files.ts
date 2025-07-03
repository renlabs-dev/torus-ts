import { assert } from "tsafe";

const FILE_NAME_REGEX = /^(.+?)(\.[^.]+)?$/;

/**
 * Shortens a filename to `maxLength` characters, preserving the extension
 * and adding an ellipsis in the middle when necessary.
 */
export const smallFilename = (name: string, maxLength = 20): string => {
  // Max length cannot be less than 1
  maxLength = maxLength < 0 ? 1 : maxLength;

  if (name.length <= maxLength) {
    return name;
  }

  const match = FILE_NAME_REGEX.exec(name);
  if (match == null) {
    // Should never happen
    return name.slice(0, maxLength);
  }

  const [_all, namePart, extPart] = match;
  assert(namePart != null, "Filename must have a 'name' part");

  if (extPart) {
    const extSize = extPart.length;
    const inner = smallFilename(namePart, maxLength - extSize);
    return `${inner}${extPart}`;
  }

  // On the base name part, we need at least 3 characters.
  // e.g. x…y
  maxLength = maxLength < 3 ? 3 : maxLength;

  // We want to split the namePart into two parts, the start and the end.
  const startSize = Math.ceil(maxLength / 2);

  // If maxLength is odd, we get one spare character for the ellipsis because of
  // the integer division by 2. If maxLength is even, we force the spare
  // character to be included in the endSize by subtracting 1.
  const endSize = 2 * startSize < maxLength ? startSize : startSize - 1;

  const start = namePart.slice(0, startSize);
  const end = namePart.slice(namePart.length - endSize);

  return `${start}…${end}`;
};
