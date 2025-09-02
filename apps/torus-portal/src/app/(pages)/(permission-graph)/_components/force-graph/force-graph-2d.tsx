"use client";

import * as d3 from "d3";
import type {
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3-force";
import { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { useCallback, useEffect, useRef } from "react";
import type {
  CustomGraphData,
  CustomGraphLink,
  CustomGraphNode,
} from "../permission-graph-types";
import { graphConstants } from "./force-graph-constants";

type D3SimulationNode = CustomGraphNode &
  SimulationNodeDatum & {
    gfx?: PIXI.Graphics;
  };

type D3SimulationLink = CustomGraphLink & SimulationLinkDatum<D3SimulationNode>;

interface ForceGraph2DProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  allocatorAddress: string;
}

function hexToPixi(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function getNodeRadius(nodeType?: string): number {
  switch (nodeType) {
    case "allocator":
      return graphConstants.nodeConfig.nodeGeometry.allocator.radius;
    case "root_agent":
      return graphConstants.nodeConfig.nodeGeometry.rootNode.radius;
    case "permission":
      return graphConstants.nodeConfig.nodeGeometry.permissionNode.radius;
    case "target_agent":
      return graphConstants.nodeConfig.nodeGeometry.targetNode.radius;
    case "signal":
      return graphConstants.nodeConfig.nodeGeometry.signalNode.radius;
    default:
      return 10;
  }
}

function getNodeColor(node: CustomGraphNode, userAddress?: string): string {
  if (userAddress && node.id.toLowerCase() === userAddress.toLowerCase()) {
    return graphConstants.nodeConfig.nodeColors.userNode;
  }
  return node.color ?? graphConstants.nodeConfig.nodeColors.default;
}

export function ForceGraphCanvas2D(props: ForceGraph2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const simulationRef = useRef<Simulation<
    D3SimulationNode,
    D3SimulationLink
  > | null>(null);
  const onNodeClickRef = useRef(props.onNodeClick);

  // Update the ref when props change
  // onNodeClickRef.current = props.onNodeClick;

  const runForceGraph2D = useCallback(
    async (
      container: HTMLDivElement,
      nodesData: D3SimulationNode[],
      linksData: D3SimulationLink[],
    ) => {
      const nodes = nodesData.map((node) => ({
        ...node,
      }));
      const links = linksData.map((link) => ({
        ...link,
      }));

      const containerRect = container.getBoundingClientRect();
      const height = containerRect.height;
      const width = containerRect.width;

      container.innerHTML = "";

      const app = new PIXI.Application();

      // Initialize the app asynchronously (required in PIXI v8)
      await app.init({
        width,
        height,
        antialias: true,
        resolution: 1,
        backgroundColor: 0x111111,
      });

      container.appendChild(app.canvas);
      appRef.current = app;

      // Create viewport
      const viewport = new Viewport({
        screenWidth: width,
        screenHeight: height,
        worldWidth: width * 4,
        worldHeight: height * 4,
        passiveWheel: false,
        events: app.renderer.events,
      });

      app.stage.addChild(viewport);

      // Activate plugins
      viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate()
        .clampZoom({
          minWidth: width / 4,
          minHeight: height / 4,
        });

      // Center the allocator node (find it and set its position)
      const allocatorNode = nodes.find((n) => n.id === props.allocatorAddress);
      if (allocatorNode) {
        allocatorNode.fx = width / 2;
        allocatorNode.fy = height / 2;
        allocatorNode.x = width / 2;
        allocatorNode.y = height / 2;
      }

      const simulation = d3
        .forceSimulation<D3SimulationNode>(nodes)
        .force(
          "link",
          d3
            .forceLink<D3SimulationNode, D3SimulationLink>(links)
            .id((d) => d.id)
            .distance(200),
        )
        .force(
          "charge",
          d3.forceManyBody().strength(-120), // Stronger repulsion to spread nodes out
        )
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.03)) // Very weak centering
        .force(
          "collision",
          d3
            .forceCollide()
            .radius((d) => getNodeRadius((d as D3SimulationNode).nodeType) + 25) // Larger collision radius
            .iterations(2), // Fewer iterations for better performance
        )
        .velocityDecay(0.2); // Much lower velocity decay for faster settling

      simulationRef.current = simulation;

      const visualLinks = new PIXI.Graphics();
      viewport.addChild(visualLinks);

      // Create nodes
      nodes.forEach((node) => {
        const radius = getNodeRadius(node.nodeType);
        const color = getNodeColor(node, props.userAddress);

        const nodeGraphics = new PIXI.Graphics();
        node.gfx = nodeGraphics;

        nodeGraphics.alpha = 1.0;

        // Different shapes for different node types
        if (node.nodeType === "permission") {
          // Draw diamond shape for permissions
          const points = [
            0,
            -radius, // top
            radius,
            0, // right
            0,
            radius, // bottom
            -radius,
            0, // left
          ];
          nodeGraphics
            .poly(points)
            .fill({ color: hexToPixi(color) })
            .stroke({ width: 1, color: 0xd3d3d3 });
        } else if (node.nodeType === "signal") {
          // Draw triangle for signals
          const points = [
            0,
            -radius, // top
            -radius,
            radius, // bottom left
            radius,
            radius, // bottom right
          ];
          nodeGraphics
            .poly(points)
            .fill({ color: hexToPixi(color) })
            .stroke({ width: 1, color: 0xd3d3d3 });
        } else {
          // Draw circle for other node types
          nodeGraphics
            .circle(0, 0, radius)
            .fill({ color: hexToPixi(color) })
            .stroke({ width: 1, color: 0xd3d3d3 });
        }

        // Event handlers
        nodeGraphics.on("click", (e: PIXI.FederatedPointerEvent) => {
          e.stopPropagation();
          onNodeClickRef.current(node);
        });

        viewport.addChild(nodeGraphics);

        nodeGraphics.interactive = true;
        nodeGraphics.cursor = "pointer";
        nodeGraphics.hitArea = new PIXI.Circle(0, 0, radius);
      });

      const ticked = () => {
        nodes.forEach((node) => {
          const { x, y } = node;
          const gfx = node.gfx;
          if (gfx && x !== undefined && y !== undefined) {
            gfx.position = new PIXI.Point(x, y);
          }
        });

        // Clear and redraw links
        visualLinks.clear();
        visualLinks.removeChildren();

        links.forEach((link) => {
          const source = link.source as D3SimulationNode;
          const target = link.target as D3SimulationNode;

          if (
            source.x !== undefined &&
            source.y !== undefined &&
            target.x !== undefined &&
            target.y !== undefined
          ) {
            const linkColor = graphConstants.linkConfig.linkColors.defaultLink;
            const alpha = 0.2;

            const linkWidth = graphConstants.linkConfig.linkWidth;
            visualLinks
              .moveTo(source.x, source.y)
              .lineTo(target.x, target.y)
              .stroke({ width: linkWidth, color: hexToPixi(linkColor), alpha });
          }
        });
      };

      simulation.on("tick", ticked);

      // Call the first tick to initialize positions and render
      ticked();

      return {
        destroy: () => {
          simulation.stop();
          nodes.forEach((node) => {
            const gfx = node.gfx;
            if (gfx) {
              gfx.destroy();
            }
          });
          visualLinks.destroy();
          app.destroy(true);
        },
      };
    },
    [props.userAddress, props.allocatorAddress],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: { destroy: () => void } | null = null;

    const initGraph = async () => {
      if (containerRef.current) {
        cleanup = await runForceGraph2D(
          containerRef.current,
          props.graphData.nodes,
          props.graphData.links as D3SimulationLink[],
        );
      }
    };

    void initGraph();

    return () => {
      cleanup?.destroy();
    };
  }, [props.graphData.nodes, props.graphData.links, runForceGraph2D]);

  return <div ref={containerRef} className="bg-background fixed inset-0 z-0" />;
}
