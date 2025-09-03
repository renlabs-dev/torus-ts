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

interface ForceGraph2DProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  allocatorAddress: string;
}

function getNodeTooltipText(node: CustomGraphNode): string {
  switch (node.nodeType) {
    case "allocator":
      return `Allocator: ${node.name || node.id}`;
    case "root_agent":
      return `Root Agent: ${node.name || node.id}`;
    case "target_agent":
      return `Target Agent: ${node.name || node.id}`;
    case "permission":
      return `Permission: ${node.id}`;
    case "signal":
      return `Signal: ${node.name || node.id}`;
    default:
      return `Node: ${node.name || node.id}`;
  }
}

export function ForceGraphCanvas2D(props: ForceGraph2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const simulationRef = useRef<Simulation<
    D3SimulationNode,
    D3SimulationLink
  > | null>(null);
  const onNodeClickRef = useRef(props.onNodeClick);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

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

      await app.init({
        width,
        height,
        resolution: 1,
        antialias: true,
        resizeTo: window,
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

      viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate()
        .clampZoom({
          minWidth: width / 4,
          minHeight: height / 4,
        });

      const allocatorNode = nodes.find((n) => n.id === props.allocatorAddress);
      if (allocatorNode) {
        allocatorNode.fx = width / 2;
        allocatorNode.fy = height / 2;
        allocatorNode.x = width / 2;
        allocatorNode.y = height / 2;
      }

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink<D3SimulationNode, D3SimulationLink>(links)
            .id((d) => d.id)
            .distance(60),
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("center", d3.forceCenter(width / 2, height / 2));

      simulationRef.current = simulation;

      const visualLinks = new PIXI.Graphics();
      viewport.addChild(visualLinks);

      // Create tooltip element
      if (!tooltipRef.current) {
        const tooltip = document.createElement("div");
        tooltip.style.position = "fixed";
        tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        tooltip.style.color = "white";
        tooltip.style.padding = "8px 12px";
        tooltip.style.borderRadius = "4px";
        tooltip.style.fontSize = "14px";
        tooltip.style.fontFamily = "monospace";
        tooltip.style.pointerEvents = "none";
        tooltip.style.zIndex = "1000";
        tooltip.style.display = "none";
        tooltip.style.maxWidth = "200px";
        tooltip.style.wordWrap = "break-word";
        document.body.appendChild(tooltip);
        tooltipRef.current = tooltip;
      }

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

        // Hover handlers for tooltip
        nodeGraphics.on("pointerover", (e: PIXI.FederatedPointerEvent) => {
          if (tooltipRef.current) {
            tooltipRef.current.textContent = getNodeTooltipText(node);
            tooltipRef.current.style.display = "block";
            tooltipRef.current.style.left = `${e.globalX + 10}px`;
            tooltipRef.current.style.top = `${e.globalY - 10}px`;
          }
        });

        nodeGraphics.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
          if (
            tooltipRef.current &&
            tooltipRef.current.style.display === "block"
          ) {
            tooltipRef.current.style.left = `${e.globalX + 10}px`;
            tooltipRef.current.style.top = `${e.globalY - 10}px`;
          }
        });

        nodeGraphics.on("pointerout", () => {
          if (tooltipRef.current) {
            tooltipRef.current.style.display = "none";
          }
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

          // Hide tooltip
          if (tooltipRef.current) {
            tooltipRef.current.style.display = "none";
          }
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

      // Clean up tooltip element
      if (tooltipRef.current) {
        document.body.removeChild(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, [props.graphData.nodes, props.graphData.links, runForceGraph2D]);

  return (
    <div
      ref={containerRef}
      className="bg-background animate-fade animate-delay-1000 fixed inset-0 z-0"
    />
  );
}
