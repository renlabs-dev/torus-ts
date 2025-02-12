# Torus Subspace

The `@torus-ts/subspace` package needs to be builded and imported indirectly,
otherwise dependant packages may typecheck it's sources and cause
conflict in the generated/augmented types.
