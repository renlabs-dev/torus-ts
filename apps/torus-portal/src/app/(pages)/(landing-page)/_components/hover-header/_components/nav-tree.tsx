"use client";

import { Button } from "@torus-ts/ui/components/button";
import { cn } from "@torus-ts/ui/lib/utils";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";
import type { NavEntry, NavTarget } from "../../nav-links";
import { NAV_ENTRIES } from "../../nav-links";

/**
 * A nav node positioned in viewBox coordinates. Connector lines are derived
 * from the parent-child structure, so buttons and lines share a single
 * source of truth and cannot drift out of alignment.
 */
interface NavNodeSpec extends NavEntry {
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

// Desktop: every entry fans out directly under the logo in one even row.
const DESKTOP_LAYOUT = {
  width: 1000,
  height: 170,
  rootX: 500,
  childY: 120,
  firstX: 150,
  lastX: 850,
};

function desktopNavTree(entries: readonly NavEntry[]): NavTreeSpec {
  const { width, height, rootX, childY, firstX, lastX } = DESKTOP_LAYOUT;
  const count = entries.length;
  const step = count > 1 ? (lastX - firstX) / (count - 1) : 0;
  return {
    width,
    height,
    root: { x: rootX, y: 0 },
    nodes: entries.map((entry, index) => ({
      ...entry,
      x: count > 1 ? firstX + step * index : rootX,
      y: childY,
    })),
  };
}

// Mobile: one vertical chain down the center line, so the whole nav reads as
// a single unfolding thread under the logo.
const MOBILE_LAYOUT = {
  width: 400,
  centerX: 200,
  firstY: 90,
  stepY: 85,
  bottomPad: 45,
};

function mobileNavTree(entries: readonly NavEntry[]): NavTreeSpec {
  const { width, centerX, firstY, stepY, bottomPad } = MOBILE_LAYOUT;
  const nodes = entries.reduceRight<NavNodeSpec[]>(
    (children, entry, index) => [
      {
        ...entry,
        x: centerX,
        y: firstY + index * stepY,
        ...(children.length > 0 ? { children } : {}),
      },
    ],
    [],
  );
  return {
    width,
    height: firstY + (entries.length - 1) * stepY + bottomPad,
    root: { x: centerX, y: 0 },
    nodes,
  };
}

export const DESKTOP_NAV_TREE = desktopNavTree(NAV_ENTRIES);
export const MOBILE_NAV_TREE = mobileNavTree(NAV_ENTRIES);

/** Stagger timing (seconds) for the unfold choreography, keyed by tree depth. */
const EDGE_DELAY_STEP = 0.1;
const EDGE_DURATION = 0.45;
const NODE_DELAY_BASE = 0.1;
const NODE_DELAY_STEP = 0.1;
const NODE_SIBLING_STEP = 0.04;

interface RenderNode extends NavEntry {
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
  target,
  label,
  onAboutClick,
}: Readonly<{
  target: NavTarget;
  label: string;
  onAboutClick: () => void;
}>) {
  switch (target.kind) {
    // About is the one in-page action; the light (primary) shade sets it
    // apart from the outline link pills.
    case "about":
      return (
        <Button size="lg" className="w-28" onClick={onAboutClick}>
          {label}
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
          <Link href={target.href} target="_blank" rel="noopener noreferrer">
            {label}
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
            <NavPill
              target={node.target}
              label={node.label}
              onAboutClick={onAboutClick}
            />
          </motion.div>
        </div>
      ))}
    </nav>
  );
}
