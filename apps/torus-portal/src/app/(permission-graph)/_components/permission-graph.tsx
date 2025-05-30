"use client";

import dynamic from "next/dynamic";
import { Suspense, useRef, useMemo, memo, useCallback, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { lightenColor } from "./permission-graph-utils";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-types";
import type { GraphMethods, NodeObject, LinkObject } from "r3f-forcegraph";

const R3fForceGraph = dynamic(() => import("r3f-forcegraph"), { ssr: false });

interface ForceGraphProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
}

const ForceGraph = memo(
  function ForceGraph(props: ForceGraphProps) {
    const fgRef = useRef<GraphMethods | undefined>(undefined);
    const linkDistance = 100;

    const [highlightNodes, setHighlightNodes] = useState<Set<string>>(
      new Set(),
    );
    const [highlightLinks, setHighlightLinks] = useState<Set<string>>(
      new Set(),
    );
    const [hoverNode, setHoverNode] = useState<string | null>(null);

    useFrame(() => {
      if (fgRef.current?.d3Force) {
        const linkForce = fgRef.current.d3Force("link");
        if (linkForce && typeof linkForce.distance === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          linkForce.distance(linkDistance);
        }
        fgRef.current.tickFrame();
      }
    });

    const neighborMap = useMemo(() => {
      const map = new Map<string, Set<string>>();
      props.graphData.links.forEach((link) => {
        const sourceId =
          (typeof link.source === "object"
            ? link.source.id
            : link.source
          )?.toString() ?? "";
        const targetId =
          (typeof link.target === "object"
            ? link.target.id
            : link.target
          )?.toString() ?? "";

        if (sourceId && targetId) {
          if (!map.has(sourceId)) map.set(sourceId, new Set());
          if (!map.has(targetId)) map.set(targetId, new Set());

          map.get(sourceId)?.add(targetId);
          map.get(targetId)?.add(sourceId);
        }
      });
      return map;
    }, [props.graphData.links]);

    const formattedData = useMemo(() => {
      return {
        nodes: props.graphData.nodes.map((node) => ({
          id: node.id,
          name: node.name,
          color: node.color,
          val: node.val,
          role: node.role,
        })),
        links: props.graphData.links.map((link) => ({
          source: link.source,
          target: link.target,
          linkDirectionalParticles: link.linkDirectionalParticles,
          linkDirectionalParticleWidth: link.linkDirectionalParticleWidth,
          linkDirectionalArrowLength: link.linkDirectionalArrowLength,
          linkDirectionalArrowRelPos: link.linkDirectionalArrowRelPos,
          linkCurvature: link.linkCurvature,
          linkColor: link.linkColor,
          linkWidth: link.linkWidth,
        })),
      };
    }, [props.graphData.nodes, props.graphData.links]);

    const handleNodeClick = useCallback(
      (node: NodeObject) => {
        props.onNodeClick({
          id: String(node.id ?? ""),
          name: String(node.name ?? `Node ${node.id}`),
          color: String(node.color ?? "#ffffff"),
          val: Number(node.val ?? 1),
        });
      },
      [props],
    );

    const handleNodeHover = useCallback(
      (node: NodeObject | null) => {
        if (node) {
          const newHighlightNodes = new Set<string>();
          const newHighlightLinks = new Set<string>();

          const nodeId = String(node.id);
          newHighlightNodes.add(nodeId);

          // Add neighbors
          const neighbors = neighborMap.get(nodeId);
          if (neighbors) {
            neighbors.forEach((neighborId) =>
              newHighlightNodes.add(neighborId),
            );
          }

          // Add connected links
          props.graphData.links.forEach((link) => {
            const sourceId =
              typeof link.source === "object" ? link.source.id : link.source;
            const targetId =
              typeof link.target === "object" ? link.target.id : link.target;

            if (sourceId === nodeId || targetId === nodeId) {
              newHighlightLinks.add(`${sourceId}-${targetId}`);
            }
          });

          setHoverNode(nodeId);
          setHighlightNodes(newHighlightNodes);
          setHighlightLinks(newHighlightLinks);
        } else {
          // Clear all highlights when not hovering
          setHoverNode(null);
          setHighlightNodes(new Set());
          setHighlightLinks(new Set());
        }
      },
      [neighborMap, props.graphData.links],
    );

    const handleLinkHover = useCallback((link: LinkObject | null) => {
      if (link) {
        const newHighlightNodes = new Set<string>();
        const newHighlightLinks = new Set<string>();

        const sourceId =
          typeof link.source === "object"
            ? String(link.source.id)
            : String(link.source);
        const targetId =
          typeof link.target === "object"
            ? String(link.target.id)
            : String(link.target);

        newHighlightLinks.add(`${sourceId}-${targetId}`);
        newHighlightNodes.add(sourceId);
        newHighlightNodes.add(targetId);

        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
      } else {
        // Clear all highlights when not hovering
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
      }
    }, []);

    return (
      <R3fForceGraph
        ref={fgRef}
        graphData={formattedData}
        nodeColor={(node: NodeObject) => {
          const nodeId = String(node.id);
          const baseColor = String(node.color ?? "#00ffff");

          // Check if this is the user's node
          if (
            props.userAddress &&
            nodeId.toLowerCase() === props.userAddress.toLowerCase()
          ) {
            return "#dc2626"; // red-600 color for user's node
          }

          if (highlightNodes.has(nodeId)) {
            // Lighten the color for highlighted nodes
            const lightenAmount = nodeId === hoverNode ? 0.4 : 0.15;
            return lightenColor(baseColor, lightenAmount);
          }
          return baseColor;
        }}
        linkDirectionalParticleWidth={(link: LinkObject) => {
          return Number(link.linkDirectionalParticleWidth);
        }}
        linkDirectionalParticles={(link: LinkObject) => {
          const sourceId =
            typeof link.source === "object"
              ? String(link.source.id)
              : String(link.source);
          const targetId =
            typeof link.target === "object"
              ? String(link.target.id)
              : String(link.target);
          const linkId = `${sourceId}-${targetId}`;
          const baseParticles = Number(link.linkDirectionalParticles ?? 0);

          if (highlightLinks.has(linkId)) {
            // Add just 2 more particles for subtle effect
            return Math.max(baseParticles + 2, 2);
          }
          return baseParticles;
        }}
        linkDirectionalArrowLength={(link: LinkObject) => {
          return Number(link.linkDirectionalArrowLength);
        }}
        linkDirectionalArrowRelPos={(link: LinkObject) => {
          return Number(link.linkDirectionalArrowRelPos);
        }}
        linkCurvature={(link: LinkObject) => {
          return Number(link.linkCurvature);
        }}
        linkColor={(link: LinkObject) => {
          return String(link.linkColor);
        }}
        linkWidth={(link: LinkObject) => {
          const sourceId =
            typeof link.source === "object"
              ? String(link.source.id)
              : String(link.source);
          const targetId =
            typeof link.target === "object"
              ? String(link.target.id)
              : String(link.target);
          const linkId = `${sourceId}-${targetId}`;
          const baseWidth = Number(link.linkWidth ?? 1);

          if (highlightLinks.has(linkId)) {
            // Subtle increase - only 1.5x the original width
            return baseWidth * 2;
          }
          return baseWidth;
        }}
        nodeResolution={46}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for ForceGraph - only re-render if graphData or userAddress changes
    return (
      prevProps.graphData === nextProps.graphData &&
      prevProps.onNodeClick === nextProps.onNodeClick &&
      prevProps.userAddress === nextProps.userAddress
    );
  },
);

const PermissionGraph = memo(
  function PermissionGraph({
    data,
    onNodeClick,
    userAddress,
  }: {
    data: CustomGraphData | null;
    onNodeClick: (node: CustomGraphNode) => void;
    userAddress?: string;
  }) {
    if (!data) {
      return (
        <div className="w-full h-full flex items-center justify-center text-slate-400 z-50">
          Loading Graph...
        </div>
      );
    }

    return (
      <Canvas camera={{ position: [0, 0, 180], far: 1000 }} shadows>
        {/* <color attach="background" args={[0.05, 0.05, 0.1]} /> */}
        <ambientLight intensity={Math.PI / 2} />
        <directionalLight position={[0, 0, 5]} intensity={Math.PI / 2} />
        <Suspense fallback={null}>
          <ForceGraph
            graphData={data}
            onNodeClick={onNodeClick}
            userAddress={userAddress}
          />
          <OrbitControls dampingFactor={0.01} enablePan={false} />
          <Stars
            radius={200}
            depth={50}
            count={2000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
        </Suspense>
      </Canvas>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if data or userAddress actually changes
    return (
      prevProps.data === nextProps.data &&
      prevProps.onNodeClick === nextProps.onNodeClick &&
      prevProps.userAddress === nextProps.userAddress
    );
  },
);

export default PermissionGraph;
