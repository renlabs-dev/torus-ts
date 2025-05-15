// == Type-level Peano Naturals with tuples ==

type A = unknown;
export type Nat = A[];
export type Zero = [];
export type One = [A];
export type Succ<N extends Nat> = [...N, A];
export type Inc<N extends Nat> = Succ<N>;
export type ToNum<N extends Nat> = N["length"];
