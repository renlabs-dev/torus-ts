# Rete Algorithm Implementation for Torus DSL

## Project Overview

We've implemented a Domain-Specific Language (DSL) for defining constraints in the Torus system, along with a Rete algorithm implementation for efficiently evaluating these constraints against a set of facts.

## Core Components

### 1. DSL and Constraints

The DSL allows defining constraints with the following components:

- **Constraint**: Top-level structure containing a permission ID and a boolean expression
- **BoolExpr**: Boolean expressions (AND, OR, NOT, comparisons)
- **BaseConstraint**: Atomic constraints (MaxDelegationDepth, PermissionExists, etc.)
- **NumExpr**: Numeric expressions (literals, block numbers, stake amounts, etc.)

Example constraint:

```typescript
const constraint = {
  permId: "transfer_permission",
  body: {
    $: "And",
    left: {
      $: "CompExpr",
      op: CompOp.Gt,
      left: { $: "StakeOf", account: "alice" },
      right: { $: "UIntLiteral", value: BigInt(1000) },
    },
    right: {
      $: "Base",
      body: { $: "PermissionExists", pid: "transfer_tokens" },
    },
  },
};
```

### 2. Facts

Facts represent the current state of the world and are classified into:

- **Account Facts**:

  - `StakeOfFact`: The stake amount of an account
  - `WeightSetFact`: The weight set from one account to another
  - `WeightPowerFromFact`: The weight power from one account to another

- **Permission Facts**:

  - `PermissionExistsFact`: Whether a permission exists
  - `PermissionEnabledFact`: Whether a permission is enabled
  - `MaxDelegationDepthFact`: The maximum delegation depth for a permission
  - `InactiveUnlessRedelegatedFact`: Whether a permission is inactive unless redelegated

- **Block Facts**:
  - `BlockFact`: The current block number and timestamp

Facts are stored in Working Memory and indexed by account ID or permission ID for efficient lookup. Facts are unique by their entity (e.g., one stake fact per account) and are updated in place when new values arrive.

### 3. Rete Network

The Rete network consists of:

- **Alpha Network**: Filters individual facts

  - Indexed by fact type and entity ID (account/permission)
  - Facts are updated in place when new values arrive

- **Beta Network**: Joins related facts

  - Builds on alpha memories to create combinations of facts
  - Maintains history of combinations (tokens)

- **Production Nodes**: Represent activated constraints
  - Activated when a complete set of matching facts is found
  - Store the facts that triggered the activation

### 4. Fact Updates and Propagation

When a fact is updated:

1. The working memory updates the fact in place
2. Alpha memories update their copies of the fact
3. The fact is propagated through the beta network
4. Production nodes are activated with the updated facts

This ensures that changes to facts (like updating a stake amount) properly update the constraint activations.

## Implementation Status

We have implemented:

1. **Core DSL Types and Constraints**: All core types for defining constraints are implemented.

2. **Fact Extraction**: Functions to extract facts from constraints.

3. **Rete Network**:

   - Alpha network with fact indexing
   - Beta network with token joining
   - Production nodes for constraint activation
   - Fact updating mechanism for in-place updates

4. **Visualization**: Tools for visualizing the network state.

## Testing

Two main test files demonstrate the functionality:

1. `rete-mock-test.ts`: Tests constraint activation with mock facts
2. `rete-update-test.ts`: Tests in-place fact updates and their propagation

## Performance Considerations

- **Efficient Fact Storage**: Facts are stored in hashmaps with constant-time lookup
- **Entity-based Indexing**: Facts are indexed by their entity ID (account/permission)
- **In-place Updates**: Facts are updated in place rather than removed and re-added
- **Token Tracking**: We track unique combinations of facts for clarity in activations

## Future Improvements

1. **Improved Fact Propagation**: Enhance how updated facts propagate through the network
2. **Temporal Facts**: Better support for time-based facts and rate limits
3. **Negative Condition Handling**: Improve handling of NOT conditions
4. **Performance Optimizations**: Further optimize join operations
5. **Memory Management**: Implement garbage collection for old tokens

## Usage Example

```typescript
// Create a Rete network
const network = new ReteNetwork();

// Add a constraint to the network
const constraint = {
  permId: "stake_constraint",
  body: {
    $: "CompExpr",
    op: CompOp.Gt,
    left: { $: "StakeOf", account: "alice" },
    right: { $: "UIntLiteral", value: BigInt(1000) },
  },
};
const productionId = network.addConstraint(constraint);

// Add a fact to the network
const stakeFact: StakeOfFact = {
  type: "StakeOf",
  account: "alice",
  amount: BigInt(1500),
};
network.addFact(stakeFact);

// Check if constraint is activated
const isActivated = network.isConstraintActivated(productionId);
console.log(`Constraint activated: ${isActivated}`);

// Update the fact
const updatedStake: StakeOfFact = {
  type: "StakeOf",
  account: "alice",
  amount: BigInt(2000),
};
network.addFact(updatedStake);
```

## Key Files

- `types.ts`: Core DSL type definitions
- `facts.ts`: Fact types and extraction functions
- `rete.ts`: Rete network implementation
- `rete-update-test.ts`: Test for fact updates
- `RETE-IMPLEMENTATION.md`: This overview document

## Notes on the Rete Algorithm

The Rete algorithm is a pattern matching algorithm for implementing rule-based systems, designed to efficiently match facts against rules (constraints in our case). Key advantages:

1. **Node Sharing**: Common patterns are shared across rules
2. **State Saving**: Previous matches are saved to avoid redundant computation
3. **Indexing**: Facts are indexed for efficient access
4. **Incremental Updates**: Only changes propagate through the network

Our implementation follows these principles while adapting to the specific needs of the Torus constraint system, particularly with efficient fact updates and entity-based indexing.
