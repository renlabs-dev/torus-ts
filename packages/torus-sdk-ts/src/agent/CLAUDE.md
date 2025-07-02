# Agent System - Development Notes

This document tracks the current development state and architecture of the Torus Agent system.

## Current Status

### ✅ Completed Features

#### JWT-Only Authentication System

- **Removed signature-based authentication** completely from the system
- **JWT tokens with SR25519 signatures** as the sole authentication method
- **Protocol metadata integration** - JWTs now include `_protocol_metadata` with version info
- **Enhanced security** - JWT verification validates protocol version compatibility
- **Test coverage** - Updated all test files to use JWT-only authentication

#### Namespace Permission Integration

- **Per-endpoint namespace protection** - Each endpoint can configure its own namespace permissions
- **Automatic path generation** - Uses `agent.<agent_name>.<endpoint_name>` format by default
- **Custom namespace paths** - Endpoints can specify custom paths for granular control
- **Optional protection** - Endpoints can disable namespace checking with `enabled: false`
- **Blockchain integration ready** - RPC endpoint configuration for permission verification
- **Proper error handling** - Returns 403 with `NAMESPACE_ACCESS_DENIED` for unauthorized access

## Architecture Overview

### Authentication Flow

```
1. Client creates JWT with protocol metadata →
2. Server validates JWT + protocol version →
3. Namespace permission check (if enabled) →
4. Endpoint execution
```

### Namespace Permission System

The agent system integrates with the Torus blockchain's namespace permission system:

- **Hierarchical namespaces** - Follow dot-separated paths like `agent.alice.memory.twitter`
- **Permission contracts** - Blockchain-based permissions that can be delegated between agents
- **Granular access control** - Users must have explicit permission for the namespace path
- **Integration with permission0 pallet** - Leverages the recursive emission delegation system

### Agent Configuration

```typescript
// Per-endpoint namespace configuration
agent.method("hello", {
  auth: { required: true },
  namespace: {
    enabled: true, // Enable namespace protection
    path: "agent.alice.memory.twitter", // Custom path (optional)
    rpcUrls: ["wss://api.testnet.torus.network"], // RPC endpoints for permission checks (random selection)
  },
  // ... rest of configuration
});
```

## File Structure

```
src/agent/
├── agent.ts              # Main Agent class with namespace integration
├── utils.ts               # JWT verification and auth utilities
├── jwt-sr25519.ts         # SR25519 JWT implementation with protocol metadata
└── CLAUDE.md             # This file - development notes
```

## Key Design Decisions

### 1. JWT-Only Authentication

**Decision**: Remove signature-based authentication entirely
**Rationale**:

- Simplifies the authentication flow
- JWT standard provides better interoperability
- Protocol metadata ensures version compatibility
- Easier to implement and maintain

### 2. Per-Endpoint Namespace Configuration

**Decision**: Configure namespace protection at the endpoint level, not server level
**Rationale**:

- Different endpoints may need different namespace paths
- Allows granular control over which endpoints require permissions
- More flexible for complex agent architectures
- Follows principle of least privilege

### 3. Automatic Namespace Path Generation

**Decision**: Default to `agent.<agent_name>.<endpoint_name>` format
**Rationale**:

- Follows the hierarchical structure from torus-substrate
- Provides sensible defaults while allowing customization
- Aligns with the namespace documentation patterns
- Easy to understand and predict

## Integration with Torus Blockchain

The agent system integrates with several Torus blockchain pallets:

### permission0 Pallet

- **Namespace permissions** - Delegates access to specific namespace paths
- **Permission contracts** - Defines grantor, grantee, duration, and revocation terms
- **Hierarchical delegation** - Supports recursive permission trees

### torus0 Pallet

- **Namespace creation** - Agents can create and manage namespace paths
- **Namespace validation** - Ensures paths follow proper format and constraints

## Current Implementation Status

### ✅ Working

- JWT authentication with protocol metadata
- Namespace permission checking framework
- Per-endpoint configuration
- Error handling and proper HTTP status codes
- Test coverage for authentication flows

### 🚧 In Progress / TODO

- **RPC integration** - Actual blockchain calls for permission verification (currently placeholder)
- **Agent name resolution** - Convert SS58 addresses to agent names for namespace paths
- **Caching layer** - Cache permission results to reduce blockchain queries
- **Permission delegation UI** - Tools for managing namespace permissions

### 🔍 Next Steps

1. **Implement RPC calls** to the Torus blockchain for actual permission verification
2. **Add agent name lookup** to resolve SS58 addresses to agent names
3. **Performance optimization** with permission caching
4. **Enhanced error messages** with more context about permission requirements
5. **Documentation** for agent developers on using namespace permissions

## Security Considerations

### JWT Security

- **SR25519 signatures** provide cryptographic security
- **Protocol version validation** prevents compatibility attacks
- **Token expiration** limits exposure window
- **Nonce inclusion** prevents replay attacks

### Namespace Security

- **Blockchain-based permissions** provide tamper-proof access control
- **Granular path permissions** follow principle of least privilege
- **Proper error handling** prevents information leakage
- **RPC validation** ensures permissions are current and valid

## Testing Strategy

### Current Test Coverage

- **JWT creation and validation** - Including protocol metadata
- **Authentication flows** - Success and failure cases
- **Token age validation** - Ensures old tokens are rejected
- **Error handling** - Proper error codes and messages

### Planned Test Coverage

- **Namespace permission scenarios** - Valid and invalid access attempts
- **RPC integration tests** - Mock blockchain responses
- **Performance tests** - Permission checking latency
- **Edge cases** - Network failures, invalid configurations

## Notes for Future Development

### Performance Considerations

- **Permission caching** will be critical for production deployments
- **Batch permission checks** for endpoints that need multiple namespaces
- **Circuit breakers** for RPC failures to maintain service availability

### Scalability

- **Connection pooling** for RPC endpoints
- **Background permission refresh** to keep cache current
- **Metric collection** for monitoring permission check performance

### Developer Experience

- **Clear error messages** when permissions are missing
- **Developer tools** for testing namespace configurations
- **Documentation** with practical examples and common patterns
