"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";
import type {
  ForceGraphMethods,
  LinkObject,
  NodeObject,
} from "react-force-graph-2d";

import type {
  CustomGraphData,
  CustomGraphLink,
  CustomGraphNode,
} from "../permission-graph-types";
import { graphConstants } from "./force-graph-constants";
import { getNodeColor } from "./force-graph-highlight-utils";
import { useGraphInteractions } from "./use-graph-interactions";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface ForceGraph2DProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
}

const ForceGraph2DWrapper = memo(
  function ForceGraph2DWrapper(props: ForceGraph2DProps) {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const [forcesConfigured, setForcesConfigured] = useState(false);

    const {
      highlightState,
      handleNodeClick,
      handleNodeHover,
      // handleLinkHover, // Not used since we disabled link hover
    } = useGraphInteractions(props.graphData, props.onNodeClick);

    // Configure forces similar to 3D version
    useEffect(() => {
      if (fgRef.current && !forcesConfigured) {
        const fg = fgRef.current;

        // Configure charge force
        const chargeForce = fg.d3Force("charge");
        if (
          chargeForce &&
          "strength" in chargeForce &&
          typeof chargeForce.strength === "function"
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          chargeForce.strength(graphConstants.physics.chargeStrength);
        }

        // Configure link force
        const linkForce = fg.d3Force("link");
        if (
          linkForce &&
          "distance" in linkForce &&
          typeof linkForce.distance === "function"
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          linkForce.distance(graphConstants.physics.linkDistance);
        }

        // Configure center force
        const centerForce = fg.d3Force("center");
        if (
          centerForce &&
          "strength" in centerForce &&
          typeof centerForce.strength === "function"
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          centerForce.strength(graphConstants.physics.centerForceStrength);
        }

        setForcesConfigured(true);
        
        // Reheat simulation with new forces
        fg.d3ReheatSimulation();
      }
    }, [forcesConfigured]);

    const formatedData = useMemo(() => {
      return {
        nodes: props.graphData.nodes,
        links: props.graphData.links,
      };
    }, [props.graphData.nodes, props.graphData.links]);

    // Define sizes for different node types
    const nodeSizes = useMemo(() => ({
      allocator: 12,
      root_agent: 8,
      permission: 5,
      signal: 4,
      target_agent: 6,
    }), []);

    // Node paint function following the example pattern
    const nodePaint = useCallback(
      (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
        const customNode = node as CustomGraphNode;
        const { x, y } = node;

        if (x === undefined || y === undefined) return;

        ctx.fillStyle = color;

        const size = customNode.nodeType
          ? nodeSizes[customNode.nodeType] || 6
          : 6;

        // Draw shapes based on node type - following example pattern
        switch (customNode.nodeType) {
          case "signal":
            // Triangle
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.lineTo(x + size, y + size);
            ctx.fill();
            break;

          case "permission":
            // Rectangle
            ctx.fillRect(x - size, y - size * 0.6, size * 2, size * 1.2);
            break;

          case "allocator":
          case "root_agent":
          case "target_agent":
          default:
            // Circle
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI, false);
            ctx.fill();
            break;
        }
      },
      [nodeSizes],
    );

    // Canvas object callback with proper color handling
    const nodeCanvasObject = useCallback(
      (node: NodeObject, ctx: CanvasRenderingContext2D) => {
        const color = getNodeColor(node, highlightState, props.userAddress);
        nodePaint(node, color, ctx);
      },
      [highlightState, props.userAddress, nodePaint],
    );

    // Pointer area paint with much larger areas for better detection
    const nodePointerAreaPaint = useCallback(
      (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
        const customNode = node as CustomGraphNode;
        const { x, y } = node;
        
        if (x === undefined || y === undefined) return;
        
        // Always paint fully opaque for the hidden picking canvas
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        
        // Generous hit radius (retina-safe)
        const base = customNode.nodeType 
          ? nodeSizes[customNode.nodeType] || 6 
          : 6;
        
        // Multiply for easier picking on retina displays
        const hitRadius = base * 2.5;
        
        ctx.beginPath();
        ctx.arc(x, y, hitRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        
        ctx.globalAlpha = prevAlpha;
      },
      [nodeSizes],
    );

    // Get node size for physics calculations
    const getNodeVal = useCallback((node: NodeObject) => {
      const customNode = node as CustomGraphNode;
      // Return values that affect the force simulation
      switch (customNode.nodeType) {
        case "allocator":
          return 144; // 12^2 for area
        case "root_agent":
          return 64;  // 8^2
        case "permission":
          return 25;  // 5^2
        case "signal":
          return 16;  // 4^2
        case "target_agent":
        default:
          return 36;  // 6^2
      }
    }, []);

    return (
      <ForceGraph2D
        ref={fgRef}
        graphData={formatedData}
        nodeId="id" // Explicitly tell the lib which prop is the id
        backgroundColor="transparent"
        // Node configuration
        nodeRelSize={1}
        nodeVal={getNodeVal}
        nodeLabel="name"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        // Link configuration
        linkColor={(link: LinkObject) => {
          const customLink = link as CustomGraphLink;
          const color =
            customLink.linkColor ??
            graphConstants.linkConfig.linkColors.defaultLink;
          return color + "33"; // 20% opacity
        }}
        linkWidth={0.5}
        // Interaction handlers
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        // onLinkHover={handleLinkHover} // Disable link hover to prevent interference
        linkHoverPrecision={1} // Make link hover less sensitive
        // Controls
        enablePointerInteraction={true}
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        // Zoom settings
        minZoom={0.1}
        maxZoom={10}
        // Physics
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    );
  },
  // Use simpler comparison - check by data lengths for reliability
  (prevProps, nextProps) => {
    return (
      prevProps.graphData.nodes.length === nextProps.graphData.nodes.length &&
      prevProps.graphData.links.length === nextProps.graphData.links.length &&
      prevProps.onNodeClick === nextProps.onNodeClick &&
      prevProps.userAddress === nextProps.userAddress
    );
  },
);

export default ForceGraph2DWrapper;
