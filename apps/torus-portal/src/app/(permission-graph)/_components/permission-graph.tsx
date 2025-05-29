"use client";

import dynamic from "next/dynamic";
import { Suspense, useRef, useMemo, memo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-types";
import type { GraphMethods, NodeObject } from "r3f-forcegraph";

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

    const formattedData = useMemo(() => {
      return {
        nodes: props.graphData.nodes.map((node) => ({
          id: node.id,
          name: node.name,
          color: node.color,
          val: node.val,
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

    return (
      <R3fForceGraph
        ref={fgRef}
        graphData={formattedData}
        nodeColor={(node) => String(node.color)}
        linkDirectionalParticleWidth={(link) => {
          return Number(link.linkDirectionalParticleWidth);
        }}
        linkDirectionalParticles={(link) => {
          return Number(link.linkDirectionalParticles);
        }}
        linkDirectionalArrowLength={(link) => {
          return Number(link.linkDirectionalArrowLength);
        }}
        linkDirectionalArrowRelPos={(link) => {
          return Number(link.linkDirectionalArrowRelPos);
        }}
        linkCurvature={(link) => {
          return Number(link.linkCurvature);
        }}
        linkColor={(link) => {
          return String(link.linkColor);
        }}
        linkWidth={(link) => {
          return Number(link.linkWidth);
        }}
        nodeRelSize={3}
        nodeResolution={24}
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
          <OrbitControls dampingFactor={0.01} enablePan={false} />
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
