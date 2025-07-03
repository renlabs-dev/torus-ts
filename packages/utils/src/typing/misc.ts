/**
 * A type that can be either null or undefined, used to help handle nullable or
 * optional values.
 */
export type Nullish = null | undefined;

/**
 * A type that can be either T or null, used to handle nullable values.
 */
export type Nullable<T> = T | null;

/**
 * Extracts the type of elements from an array type.
 * If the input type is not an array, returns `never`.
 *
 * @typeParam L - The array type to extract elements from
 *
 * @example
 * type Numbers = number[];
 * type X = ListItem<Numbers>; // number
 *
 * @example
 * type NotArray = string;
 * type Y = ListItem<NotArray>; // never
 */
export type ListItem<L> = L extends (infer T)[] ? T : never;
