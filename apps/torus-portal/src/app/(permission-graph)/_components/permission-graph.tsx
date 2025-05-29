"use client";
import dynamic from "next/dynamic";
import { Suspense, useRef, useMemo, memo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { TrackballControls } from "@react-three/drei";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-utils";
import {
  getNodeColor,
  getLinkColor,
  getLinkWidth,
  getLinkCurvature,
  getLinkOpacity,
  getLinkArrowLength,
  getLinkArrowRelPos,
  getNodeRelSize,
  getNodeResolution,
} from "./permission-graph-utils";
import type { GraphMethods, LinkObject, NodeObject } from "r3f-forcegraph";

const R3fForceGraph = dynamic(() => import("r3f-forcegraph"), { ssr: false });

interface ForceGraphProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
}

const ForceGraph = memo(
  function ForceGraph(props: ForceGraphProps) {
    const fgRef = useRef<GraphMethods | undefined>(undefined);

    useFrame(() => {
      if (fgRef.current) {
        fgRef.current.tickFrame();
      }
    });

    const handleNodeClick = useCallback(
      (node: NodeObject) => {
        const graphNode = props.graphData.nodes.find((n) => n.id === node.id);
        if (graphNode) {
          props.onNodeClick(graphNode);
        }
      },
      [props],
    );

    // Create wrapped functions that match the expected signatures
    const nodeColorFunction = useCallback(
      (node: NodeObject) => getNodeColor(node, props.graphData),
      [props.graphData],
    );

    const linkColorFunction = useCallback(
      (link: LinkObject) => getLinkColor(link, props.graphData),
      [props.graphData],
    );

    const linkWidthFunction = useCallback(
      (link: LinkObject) => getLinkWidth(link, props.graphData),
      [props.graphData],
    );

    const linkCurvatureFunction = useCallback(
      (link: LinkObject) => getLinkCurvature(link, props.graphData),
      [props.graphData],
    );

    const linkOpacityFunction = useCallback(
      (link: LinkObject) => getLinkOpacity(link, props.graphData),
      [props.graphData],
    );

    const linkArrowLengthFunction = useCallback(
      (link: LinkObject) => getLinkArrowLength(link, props.graphData),
      [props.graphData],
    );

    const linkArrowRelPosFunction = useCallback(
      (link: LinkObject) => getLinkArrowRelPos(link, props.graphData),
      [props.graphData],
    );

    const nodeRelSizeFunction = useCallback(
      (node: NodeObject) => getNodeRelSize(node, props.graphData),
      [props.graphData],
    );

    const nodeResolutionFunction = useCallback(
      (node: NodeObject) => getNodeResolution(node, props.graphData),
      [props.graphData],
    );

    const formattedData = useMemo(
      () => ({
        nodes: props.graphData.nodes.map((node) => ({
          id: node.id,
          name: node.name,
          color: node.color,
          val: node.val,
        })),
        links: props.graphData.links.map((link) => ({
          source: link.source,
          target: link.target,
        })),
      }),
      [props.graphData.nodes, props.graphData.links],
    );

    return (
      <R3fForceGraph
        ref={fgRef}
        graphData={formattedData}
        nodeColor={nodeColorFunction}
        linkColor={linkColorFunction}
        linkWidth={linkWidthFunction}
        linkCurvature={linkCurvatureFunction}
        linkOpacity={linkOpacityFunction(props.graphData.links)}
        linkDirectionalArrowLength={linkArrowLengthFunction}
        linkDirectionalArrowRelPos={linkArrowRelPosFunction}
        nodeRelSize={nodeRelSizeFunction(props.graphData.nodes)}
        nodeResolution={nodeResolutionFunction(props.graphData.nodes)}
        onNodeClick={handleNodeClick}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for ForceGraph - only re-render if graphData changes
    return (
      prevProps.graphData === nextProps.graphData &&
      prevProps.onNodeClick === nextProps.onNodeClick
    );
  },
);

const PermissionGraph = memo(
  function PermissionGraph({
    data,
    onNodeClick,
  }: {
    data: CustomGraphData | null;
    onNodeClick: (node: CustomGraphNode) => void;
  }) {
    if (!data) {
      return (
        <div className="w-full h-full flex items-center justify-center text-slate-400 z-50">
          Loading Graph...
        </div>
      );
    }

    return (
      <Canvas camera={{ position: [0, 0, 100], far: 1000 }}>
        {/* <color attach="background" args={[0.05, 0.05, 0.1]} /> */}
        <ambientLight intensity={Math.PI / 2} />
        <directionalLight position={[0, 0, 5]} intensity={Math.PI / 2} />
        <Suspense fallback={null}>
          <ForceGraph graphData={data} onNodeClick={onNodeClick} />
          <TrackballControls />
        </Suspense>
      </Canvas>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if data actually changes
    return (
      prevProps.data === nextProps.data &&
      prevProps.onNodeClick === nextProps.onNodeClick
    );
  },
);

export default PermissionGraph;
