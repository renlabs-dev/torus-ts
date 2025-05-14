## 1. Current System Overview

Permission0 is a pallet that implements a permission-based delegation system focused on emission distribution in Torus. It allows agents to delegate portions of their emissions (either as percentages or fixed amounts) to other agents through a contract framework.

### Core Components

#### Permission Contracts

Each permission is represented by a contract containing:

- **Grantor**: Account granting the permission
- **Grantee**: Account receiving the permission
- **Scope**: What the permission applies to (currently only emissions)
- **Duration**: How long the permission lasts
- **Revocation Terms**: How the permission can be revoked
- **Enforcement Authority**: Who can toggle the permission
- **Execution Tracking**: Last execution, execution count
- **Parent ID**: Parent permission (if delegated)
- **Creation Time**: Block number when created

#### Permission Scope

Currently supports emission scope with:

- **Allocation**: How tokens are allocated (percentage of streams or fixed amount)
- **Distribution**: How tokens are distributed (manual, automatic, at block, interval)
- **Targets**: Which accounts receive what portion based on weights
- **Accumulation State**: Whether currently accumulating tokens

#### Enforcement Authority

The enforcement authority is an account that can toggle 
the permission accumulation state.

Controllers can:

1. Toggle permission accumulation (on/off)
2. Execute manual distribution permissions

If you want the torus portal to be able to execute permissions, you need to
appoint us as the enforcement authority.

#### Existing Constraints

The current system already enforces several constraints:

- Total allocation cannot exceed 100% of a stream
- Fixed amount allocations require sufficient balance
- Fixed amount allocations can only be triggered once
- Automatic distribution requires minimum threshold
- Distribution intervals must be non-zero
- Schedules must be in the future
- Revocation voting requirements must be valid

## 2. Off-Chain Constraint Subsystem Specification

This is where Torus Portal enters as an off-chain constraint system to extend 
the permission0 functionality by implementing a flexible constraint 
evaluation engine that interacts with the on-chain components.

In practice this is achieved by defining a DSL that allows arbitrary
composition on top of a set of primitive constraints.

>---- ED IMAGE THINGY HEREEEEEEEEEEEEEEEEEEe <----

If you want to take a peek in the code, you can find a [rough sketch of the 
DSL](https://github.com/renlabs-dev/torus-ts/blob/feat/torus-portal/apps/torus-portal/src/utils/dsl.ts) directory.
### Torus Portal Architecture Overview

1. **Chain Monitoring Service**
   - Monitors permission-related events in real-time
   - Indexes all permission data for efficient access
   - Tracks permission state changes and accumulation
2. **Constraint Engine**
   - Evaluates constraints against current chain state
   - Maintains constraint definitions in standardized format
   - Determines when permissions violate constraints
3. **Action Interface**
   - Submits transaction to toggle permission accumulation
   - Manages enforcement authority voting
   - Executes permissions when appropriate