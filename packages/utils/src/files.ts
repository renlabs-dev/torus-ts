import { assert } from "tsafe";

const FILE_NAME_REGEX = /^(.+?)(\.[^.]+)?$/g;

/**
 * TODO: bug (fooobar.png -> foob.png)
 */
export const smallFilename = (name: string, maxLength = 20): string => {
  maxLength = maxLength < 0 ? 0 : maxLength;
  if (name.length <= maxLength) {
    return name;
  }
  const match = FILE_NAME_REGEX.exec(name);
  if (match == null) {
    // should never happen
    return name.slice(0, maxLength);
  }

  const namePart = match[1];
  const extPart = match[2];
  assert(namePart, "Filename must have a 'name' part");

  if (extPart) {
    const extSize = extPart.length;
    const inner = smallFilename(namePart, maxLength - extSize);
    return `${inner}${extPart}`;
  }

  const halfSize = Math.ceil(maxLength / 2);

  const start = namePart.slice(0, halfSize);
  const end = namePart.slice(namePart.length - halfSize);

  return `${start}...${end}`;
};

export const strToFile = (
  str: string,
  filename: string,
  type = "text/plain",
) => {
  const file = new File([str], filename, { type });
  return file;
};
