import type { Edge, Node } from "@xyflow/react";

interface NamespacePathNodeData extends Record<string, unknown> {
  label: string;
  acessible: boolean;
  redelegationCount: number;
}

export const nodes: Node<NamespacePathNodeData>[] = [
  // Agent bob - Simple level (Level 1: mixed accessibility)
  {
    id: "agent-bob",
    data: {
      label: "agent.bob",
      acessible: true,
      redelegationCount: 3,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "bob-compute",
    data: {
      label: "agent.bob.compute",
      acessible: true,
      redelegationCount: 1,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "bob-storage",
    data: {
      label: "agent.bob.storage",
      acessible: false,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },

  // Agent charlie - Bridge capabilities (Level 2: accessible)
  {
    id: "agent-charlie",
    data: {
      label: "agent.charlie",
      acessible: true,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "charlie-bridge",
    data: {
      label: "agent.charlie.bridge",
      acessible: true,
      redelegationCount: 1,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "charlie-bridge-ethereum",
    data: {
      label: "agent.charlie.bridge.ethereum",
      acessible: false,
      redelegationCount: 0,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "charlie-bridge-polygon",
    data: {
      label: "agent.charlie.bridge.polygon",
      acessible: false,
      redelegationCount: 0,
    },
    position: { x: 0, y: 0 },
  },

  // Agent diana - Network operations (Level 2: accessible)
  {
    id: "agent-diana",
    data: {
      label: "agent.diana",
      acessible: true,
      redelegationCount: 5,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "diana-network",
    data: {
      label: "agent.diana.network",
      acessible: true,
      redelegationCount: 3,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "diana-network-storage",
    data: {
      label: "agent.diana.network.storage",
      acessible: true,
      redelegationCount: 1,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "diana-network-broadcast",
    data: {
      label: "agent.diana.network.broadcast",
      acessible: false,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },

  // Agent eve - Simple level (Level 1: accessible)
  {
    id: "agent-eve",
    data: {
      label: "agent.eve",
      acessible: true,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "eve-monitor",
    data: {
      label: "agent.eve.monitor",
      acessible: true,
      redelegationCount: 1,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "eve-audit",
    data: {
      label: "agent.eve.audit",
      acessible: false,
      redelegationCount: 0,
    },
    position: { x: 0, y: 0 },
  },

  // Agent services - Infrastructure (Level 3: deep hierarchy)
  {
    id: "agent-services",
    data: {
      label: "agent.services",
      acessible: true,
      redelegationCount: 12,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "service-database",
    data: {
      label: "agent.services.database",
      acessible: true,
      redelegationCount: 7,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "service-messaging",
    data: {
      label: "agent.services.messaging",
      acessible: true,
      redelegationCount: 3,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "service-cache",
    data: {
      label: "agent.services.cache",
      acessible: false,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },

  // Database operations (Level 3)
  {
    id: "db-read",
    data: {
      label: "agent.services.database.read",
      acessible: true,
      redelegationCount: 4,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "db-write",
    data: {
      label: "agent.services.database.write",
      acessible: true,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "db-admin",
    data: {
      label: "agent.services.database.admin",
      acessible: false,
      redelegationCount: 1,
    },
    position: { x: 0, y: 0 },
  },

  // Database admin operations (Level 4: deepest)
  {
    id: "db-admin-backup",
    data: {
      label: "agent.services.database.admin.backup",
      acessible: false,
      redelegationCount: 0,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "db-admin-restore",
    data: {
      label: "agent.services.database.admin.restore",
      acessible: false,
      redelegationCount: 0,
    },
    position: { x: 0, y: 0 },
  },

  // Messaging capabilities (Level 3)
  {
    id: "msg-send",
    data: {
      label: "agent.services.messaging.send",
      acessible: true,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "msg-broadcast",
    data: {
      label: "agent.services.messaging.broadcast",
      acessible: true,
      redelegationCount: 1,
    },
    position: { x: 0, y: 0 },
  },

  // Agent governance - DAO operations (Level 2: mixed access)
  {
    id: "agent-governance",
    data: {
      label: "agent.governance",
      acessible: true,
      redelegationCount: 8,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "gov-proposals",
    data: {
      label: "agent.governance.proposals",
      acessible: true,
      redelegationCount: 5,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "gov-voting",
    data: {
      label: "agent.governance.voting",
      acessible: false,
      redelegationCount: 3,
    },
    position: { x: 0, y: 0 },
  },

  // Proposal operations (Level 3)
  {
    id: "prop-create",
    data: {
      label: "agent.governance.proposals.create",
      acessible: true,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "prop-vote",
    data: {
      label: "agent.governance.proposals.vote",
      acessible: false,
      redelegationCount: 0,
    },
    position: { x: 0, y: 0 },
  },

  // Agent api - Complex API system (Level 4: deepest with mixed access)
  {
    id: "agent-api",
    data: {
      label: "agent.api",
      acessible: true,
      redelegationCount: 6,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "api-v1",
    data: {
      label: "agent.api.v1",
      acessible: true,
      redelegationCount: 4,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "api-v2",
    data: {
      label: "agent.api.v2",
      acessible: false,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "api-v1-users",
    data: {
      label: "agent.api.v1.users",
      acessible: true,
      redelegationCount: 3,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "api-v1-posts",
    data: {
      label: "agent.api.v1.posts",
      acessible: true,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "api-v1-users-get",
    data: {
      label: "agent.api.v1.users.get",
      acessible: true,
      redelegationCount: 1,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "api-v1-users-post",
    data: {
      label: "agent.api.v1.users.post",
      acessible: false,
      redelegationCount: 0,
    },
    position: { x: 0, y: 0 },
  },
];

export const edges: Edge[] = [
  // Bob's capabilities (Level 1)
  {
    id: "bob-compute-edge",
    source: "agent-bob",
    target: "bob-compute",
  },
  {
    id: "bob-storage-edge",
    source: "agent-bob",
    target: "bob-storage",
  },

  // Charlie's bridge capabilities (Level 2)
  {
    id: "charlie-bridge-edge",
    source: "agent-charlie",
    target: "charlie-bridge",
  },
  {
    id: "charlie-bridge-ethereum-edge",
    source: "charlie-bridge",
    target: "charlie-bridge-ethereum",
  },
  {
    id: "charlie-bridge-polygon-edge",
    source: "charlie-bridge",
    target: "charlie-bridge-polygon",
  },

  // Diana's network capabilities (Level 2)
  {
    id: "diana-network-edge",
    source: "agent-diana",
    target: "diana-network",
  },
  {
    id: "diana-network-storage-edge",
    source: "diana-network",
    target: "diana-network-storage",
  },
  {
    id: "diana-network-broadcast-edge",
    source: "diana-network",
    target: "diana-network-broadcast",
  },

  // Eve's capabilities (Level 1)
  {
    id: "eve-monitor-edge",
    source: "agent-eve",
    target: "eve-monitor",
  },
  {
    id: "eve-audit-edge",
    source: "agent-eve",
    target: "eve-audit",
  },

  // Services capabilities (Level 3)
  {
    id: "services-database-edge",
    source: "agent-services",
    target: "service-database",
  },
  {
    id: "services-messaging-edge",
    source: "agent-services",
    target: "service-messaging",
  },
  {
    id: "services-cache-edge",
    source: "agent-services",
    target: "service-cache",
  },

  // Database operations (Level 3)
  {
    id: "db-read-edge",
    source: "service-database",
    target: "db-read",
  },
  {
    id: "db-write-edge",
    source: "service-database",
    target: "db-write",
  },
  {
    id: "db-admin-edge",
    source: "service-database",
    target: "db-admin",
  },

  // Database admin operations (Level 4: deepest)
  {
    id: "db-admin-backup-edge",
    source: "db-admin",
    target: "db-admin-backup",
  },
  {
    id: "db-admin-restore-edge",
    source: "db-admin",
    target: "db-admin-restore",
  },

  // Messaging operations (Level 3)
  {
    id: "msg-send-edge",
    source: "service-messaging",
    target: "msg-send",
  },
  {
    id: "msg-broadcast-edge",
    source: "service-messaging",
    target: "msg-broadcast",
  },

  // Governance capabilities (Level 2)
  {
    id: "governance-proposals-edge",
    source: "agent-governance",
    target: "gov-proposals",
  },
  {
    id: "governance-voting-edge",
    source: "agent-governance",
    target: "gov-voting",
  },

  // Governance proposal operations (Level 3)
  {
    id: "prop-create-edge",
    source: "gov-proposals",
    target: "prop-create",
  },
  {
    id: "prop-vote-edge",
    source: "gov-proposals",
    target: "prop-vote",
  },

  // API capabilities (Level 4: deepest)
  {
    id: "api-v1-edge",
    source: "agent-api",
    target: "api-v1",
  },
  {
    id: "api-v2-edge",
    source: "agent-api",
    target: "api-v2",
  },
  {
    id: "api-v1-users-edge",
    source: "api-v1",
    target: "api-v1-users",
  },
  {
    id: "api-v1-posts-edge",
    source: "api-v1",
    target: "api-v1-posts",
  },
  {
    id: "api-v1-users-get-edge",
    source: "api-v1-users",
    target: "api-v1-users-get",
  },
  {
    id: "api-v1-users-post-edge",
    source: "api-v1-users",
    target: "api-v1-users-post",
  },
];
