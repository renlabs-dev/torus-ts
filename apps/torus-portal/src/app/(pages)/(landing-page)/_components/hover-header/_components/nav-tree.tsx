"use client";

import { Button } from "@torus-ts/ui/components/button";
import { getLinks } from "@torus-ts/ui/lib/data";
import { cn } from "@torus-ts/ui/lib/utils";
import { env } from "~/env";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";

/** What activating a node does. */
type NavTarget =
  | { kind: "link"; href: string }
  | { kind: "about" }
  | { kind: "label" };

/**
 * A nav node authored in viewBox coordinates. Connector lines are derived
 * from the parent-child structure, so buttons and lines share a single
 * source of truth and cannot drift out of alignment.
 */
interface NavNodeSpec {
  id: string;
  label: string;
  target: NavTarget;
  x: number;
  y: number;
  children?: NavNodeSpec[];
}

/** A complete nav tree layout for one form factor. */
export interface NavTreeSpec {
  /** viewBox width the node coordinates are expressed in. */
  width: number;
  /** viewBox height the node coordinates are expressed in. */
  height: number;
  /** Point where the tree attaches to the logo button above it. */
  root: { x: number; y: number };
  nodes: NavNodeSpec[];
}

const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

export const DESKTOP_NAV_TREE: NavTreeSpec = {
  width: 1000,
  height: 300,
  root: { x: 500, y: 0 },
  nodes: [
    {
      id: "starter",
      label: "Starter",
      target: { kind: "label" },
      x: 260,
      y: 110,
      children: [
        {
          id: "wallet",
          label: "Wallet",
          target: { kind: "link", href: links.wallet },
          x: 85,
          y: 240,
        },
        {
          id: "bridge",
          label: "Bridge",
          target: { kind: "link", href: links.bridge },
          x: 260,
          y: 240,
        },
        {
          id: "blog",
          label: "Blog",
          target: { kind: "link", href: links.blog },
          x: 435,
          y: 240,
        },
      ],
    },
    { id: "about", label: "About", target: { kind: "about" }, x: 500, y: 110 },
    {
      id: "network",
      label: "Network",
      target: { kind: "label" },
      x: 740,
      y: 110,
      children: [
        {
          id: "join",
          label: "Join",
          target: { kind: "link", href: links.discord },
          x: 652,
          y: 240,
        },
        {
          id: "dao",
          label: "DAO",
          target: { kind: "link", href: links.governance },
          x: 828,
          y: 240,
        },
      ],
    },
  ],
};

// Mobile lays each group out as a vertical chain, so the connector of every
// node starts at the node above it and the whole column reads as one line.
export const MOBILE_NAV_TREE: NavTreeSpec = {
  width: 400,
  height: 530,
  root: { x: 200, y: 0 },
  nodes: [
    {
      id: "starter",
      label: "Starter",
      target: { kind: "label" },
      x: 105,
      y: 80,
      children: [
        {
          id: "wallet",
          label: "Wallet",
          target: { kind: "link", href: links.wallet },
          x: 105,
          y: 170,
          children: [
            {
              id: "bridge",
              label: "Bridge",
              target: { kind: "link", href: links.bridge },
              x: 105,
              y: 255,
              children: [
                {
                  id: "blog",
                  label: "Blog",
                  target: { kind: "link", href: links.blog },
                  x: 105,
                  y: 340,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "network",
      label: "Network",
      target: { kind: "label" },
      x: 295,
      y: 80,
      children: [
        {
          id: "join",
          label: "Join",
          target: { kind: "link", href: links.discord },
          x: 295,
          y: 170,
          children: [
            {
              id: "dao",
              label: "DAO",
              target: { kind: "link", href: links.governance },
              x: 295,
              y: 255,
            },
          ],
        },
      ],
    },
    { id: "about", label: "About", target: { kind: "about" }, x: 200, y: 455 },
  ],
};

/** Stagger timing (seconds) for the unfold choreography, keyed by tree depth. */
const EDGE_DELAY_STEP = 0.15;
const EDGE_DURATION = 0.45;
const NODE_DELAY_BASE = 0.1;
const NODE_DELAY_STEP = 0.15;
const NODE_SIBLING_STEP = 0.04;

interface RenderNode {
  id: string;
  label: string;
  target: NavTarget;
  x: number;
  y: number;
  delay: number;
}

interface RenderEdge {
  id: string;
  d: string;
  delay: number;
}

/**
 * Rounded org-chart elbow from a parent attachment point down to a child:
 * vertical drop, quarter turn, horizontal run, quarter turn, vertical drop.
 * Endpoints are node centers; nodes render on top with an opaque background,
 * so no per-node edge trimming is needed.
 */
function elbowPath(x1: number, y1: number, x2: number, y2: number): string {
  if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const midY = (y1 + y2) / 2;
  const dir = x2 > x1 ? 1 : -1;
  const r = Math.min(12, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
  return [
    `M ${x1} ${y1}`,
    `L ${x1} ${midY - r}`,
    `Q ${x1} ${midY} ${x1 + dir * r} ${midY}`,
    `L ${x2 - dir * r} ${midY}`,
    `Q ${x2} ${midY} ${x2} ${midY + r}`,
    `L ${x2} ${y2}`,
  ].join(" ");
}

/** Flattens a spec into positioned nodes and derived connector edges. */
function flattenSpec(spec: NavTreeSpec): {
  nodes: RenderNode[];
  edges: RenderEdge[];
} {
  const nodes: RenderNode[] = [];
  const edges: RenderEdge[] = [];

  const visit = (
    node: NavNodeSpec,
    parent: { x: number; y: number },
    level: number,
    siblingIndex: number,
  ) => {
    nodes.push({
      id: node.id,
      label: node.label,
      target: node.target,
      x: node.x,
      y: node.y,
      delay:
        NODE_DELAY_BASE +
        level * NODE_DELAY_STEP +
        siblingIndex * NODE_SIBLING_STEP,
    });
    edges.push({
      id: node.id,
      d: elbowPath(parent.x, parent.y, node.x, node.y),
      delay: level * EDGE_DELAY_STEP,
    });
    (node.children ?? []).forEach((child, index) =>
      visit(child, node, level + 1, index),
    );
  };

  spec.nodes.forEach((node, index) => visit(node, spec.root, 0, index));
  return { nodes, edges };
}

const edgeVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: EDGE_DURATION, ease: "easeInOut", delay },
      opacity: { duration: 0.1, delay },
    },
  }),
};

const nodeVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut", delay },
  }),
};

function NavPill({
  node,
  onAboutClick,
}: Readonly<{ node: RenderNode; onAboutClick: () => void }>) {
  switch (node.target.kind) {
    case "label":
      return (
        <span className="border-button-border bg-accent inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium shadow-sm">
          {node.label}
        </span>
      );
    case "about":
      return (
        <Button
          variant="outline"
          className="bg-accent hover:bg-background rounded-full"
          onClick={onAboutClick}
        >
          {node.label}
        </Button>
      );
    case "link":
      return (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="bg-background w-28"
        >
          <Link
            href={node.target.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {node.label}
          </Link>
        </Button>
      );
  }
}

interface NavTreeProps {
  spec: NavTreeSpec;
  onAboutClick: () => void;
  className?: string;
}

/**
 * Renders a nav tree spec as animated connector lines plus positioned pill
 * buttons. Both layers live in the same box whose aspect ratio matches the
 * spec's viewBox, so they scale together and stay aligned at every width.
 *
 * Expects to render inside a motion parent that drives the
 * "hidden" / "visible" variants.
 */
export function NavTree({
  spec,
  onAboutClick,
  className,
}: Readonly<NavTreeProps>) {
  const { nodes, edges } = useMemo(() => flattenSpec(spec), [spec]);

  return (
    <nav
      className={cn("relative", className)}
      style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
      aria-label="Site navigation"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${spec.width} ${spec.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {edges.map((edge) => (
          <motion.path
            key={edge.id}
            d={edge.d}
            fill="none"
            stroke="#27272a"
            strokeWidth={2.5}
            strokeLinecap="round"
            variants={edgeVariants}
            custom={edge.delay}
          />
        ))}
      </svg>
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute"
          style={{
            left: `${(node.x / spec.width) * 100}%`,
            top: `${(node.y / spec.height) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <motion.div variants={nodeVariants} custom={node.delay}>
            <NavPill node={node} onAboutClick={onAboutClick} />
          </motion.div>
        </div>
      ))}
    </nav>
  );
}
