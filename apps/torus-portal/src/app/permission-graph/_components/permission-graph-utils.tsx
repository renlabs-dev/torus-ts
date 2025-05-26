import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Copy, UserPen, UserPlus, Share2 } from "lucide-react";
import { GlobeIcon } from "lucide-react";
import type { JSX } from 'react';

interface AddressCopyButtonProps {
  link: string;
}

interface AddressLinkButtonProps {
  link: string;
}

interface AddressGoButtonProps {
  link: string;
}

export function AddressCopyButton ({link}: AddressCopyButtonProps): JSX.Element {
  return (
    <CopyButton
      className="hover:text-muted-foreground h-fit p-0"
      variant="ghost"
      copy={link}
    >
      <Copy className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity duration-150" />
    </CopyButton>
  );
}

export function AddressLinkButton({ link }: AddressLinkButtonProps): JSX.Element {
  const hostname = window.location.hostname;
  const isTestnet = typeof window !== "undefined" && (hostname.includes("testnet") || hostname.includes("localhost"));
  const baseUrl = isTestnet
    ? "https://allocator.testnet.torus.network/agent/"
    : "https://allocator.torus.network/agent/";

  const href = `${baseUrl}${link}`;

  return (
    <a
      href={href}
      target="blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors duration-200"
    >
      <GlobeIcon className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity duration-150" />
    </a>
  );
}

export function AddressGoButton({ link }: AddressGoButtonProps): JSX.Element {
  const isTestnet =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("testnet") || window.location.hostname.includes("localhost"));

  const baseUrl = isTestnet
    ? "https://allocator.testnet.torus.network/agent/"
    : "https://allocator.torus.network/agent/";

  const href = `${baseUrl}${link}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors duration-200"
    >
      <Share2 className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity duration-150" />
    </a>
  );
}

export function GranteePenIcon(): JSX.Element {
  return (
    <UserPlus className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity duration-150" />
  );
}


export function GrantorPenIcon(): JSX.Element {
  return (
    <UserPen className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity duration-150" />
  );
}




export interface CustomGraphNode {
  id: string;
  name: string;
  color?: string;
  val?: number;
  fullAddress?: string;
  role?: string;
  [key: string]: string | number | undefined;
}

export interface GraphLink {
  source: string;
  target: string;
  id?: string;
  scope?: string;
  duration?: number;
  revocation?: number;
  enforcement?: string;
  executionCount?: number;
  parentId?: number;
  [key: string]: string | number | undefined;
}

export interface CustomGraphData {
  nodes: CustomGraphNode[];
  links: GraphLink[];
}


export const formatScope = (scope: string): string => 
  scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase();

export const formatDuration = (seconds: number): string => {
  if (!seconds) return "No expiration";
  
  const days = Math.floor(seconds / 86400);
  // const hours = Math.floor((seconds % 86400) / 3600);
  // const minutes = Math.floor((seconds % 3600) / 60);
  
  return [
    days && `${days} day${days > 1 ? 's' : ''}`,
    // hours && `${hours} hour${hours > 1 ? 's' : ''}`,
    // minutes && `${minutes} minute${minutes > 1 ? 's' : ''}`
  ].filter(Boolean).join(', ');
};

interface PermissionWithType extends GraphLink {
  type: 'incoming' | 'outgoing';
}




export const getNodePermissions = (
  node: CustomGraphNode, 
  graphData: CustomGraphData
): PermissionWithType[] => {
  const permissionsMap = new Map<string, PermissionWithType>();
  
  graphData.links.forEach(link => {
    const key = `${link.source}-${link.target}`;
    
    if (link.source === node.id || link.target === node.id) {
      if (!permissionsMap.has(key)) {
        permissionsMap.set(key, {
          ...link,
          type: link.source === node.id ? 'outgoing' : 'incoming'
        });
      }
    }
  });

  return Array.from(permissionsMap.values());
};

export interface PermissionDetail {
  grantor_key: string;
  grantee_key: string;
  permission_id: number;
  scope: string;
  duration: number;
  enforcement: string;
  execution_count: number;
  parent_id: number | null;
  createdAt: Date;
}

export const sortPermissions = (
  permissions: PermissionWithType[], 
  permissionDetails: PermissionDetail[] 
): PermissionWithType[] => {
  return permissions.sort((a, b) => {
    const detailsA = permissionDetails.find(
      p => p.grantor_key === a.source && p.grantee_key === a.target
    );
    const detailsB = permissionDetails.find(
      p => p.grantor_key === b.source && p.grantee_key === b.target
    );
    
    const idA = detailsA?.permission_id ?? 0;
    const idB = detailsB?.permission_id ?? 0;
    
    return Number(idA) - Number(idB);
  });
};

// Sample permission graph data
export const samplePermissionGraph: CustomGraphData = {
  nodes: [
    { id: "user", name: "User", color: "#ff6b6b", val: 10, role: "Grantor" },
    { id: "admin", name: "Admin", color: "#48dbfb", val: 10, role: "Both" },
    { id: "read", name: "Read", color: "#1dd1a1", val: 8, role: "Both" },
    { id: "write", name: "Write", color: "#f368e0", val: 8, role: "Both" },
    { id: "delete", name: "Delete", color: "#ff9f43", val: 8, role: "Both" },
    { id: "document", name: "Document", color: "#54a0ff", val: 12, role: "Grantee" },
    { id: "folder", name: "Folder", color: "#5f27cd", val: 12, role: "Grantee" },
    { id: "project", name: "Project", color: "#ee5253", val: 12, role: "Grantee" },
  ],
  links: [
    { 
      source: "user", 
      target: "read", 
      id: "1",
      scope: "EMISSION",
      duration: 86400,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "user", 
      target: "write", 
      id: "2",
      scope: "EMISSION",
      duration: 172800,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "admin", 
      target: "read", 
      id: "3",
      scope: "EMISSION",
      duration: 0,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "admin", 
      target: "write", 
      id: "4",
      scope: "EMISSION",
      duration: 0,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "admin", 
      target: "delete", 
      id: "5",
      scope: "EMISSION",
      duration: 0,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "read", 
      target: "document", 
      id: "6",
      scope: "EMISSION",
      duration: 0,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "read", 
      target: "folder", 
      id: "7",
      scope: "EMISSION",
      duration: 0,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "write", 
      target: "document", 
      id: "8",
      scope: "EMISSION",
      duration: 0,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "delete", 
      target: "document", 
      id: "9",
      scope: "EMISSION",
      duration: 0,
      enforcement: "torus_enforcement_agent"
    },
    { 
      source: "folder", 
      target: "project", 
      id: "10",
      scope: "EMISSION",
      duration: 0,
      enforcement: "torus_enforcement_agent"
    },
  ],
};