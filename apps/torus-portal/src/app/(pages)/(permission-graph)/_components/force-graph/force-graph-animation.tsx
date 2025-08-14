"use client";

import { memo, useMemo, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import dynamic from "next/dynamic";
import type { GraphMethods, LinkObject, NodeObject } from "r3f-forcegraph";
import * as THREE from "three";

import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import { graphConstants } from "./force-graph-constants";
import { useGraphInteractions } from "./use-graph-interactions";

const R3fForceGraph = dynamic(() => import("r3f-forcegraph"), { ssr: false });

interface ForceGraphProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  selectedNodeId?: string | null;
}

const ForceGraph = memo(
  function ForceGraph(props: ForceGraphProps) {
    const fgRef = useRef<GraphMethods | undefined>(undefined);

    const [forcesConfigured, setForcesConfigured] = useState(false);

    useFrame(({ clock }) => {
      if (fgRef.current?.d3Force) {
        if (!forcesConfigured) {
          const chargeForce = fgRef.current.d3Force("charge");
          if (chargeForce && typeof chargeForce.strength === "function") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            chargeForce.strength(graphConstants.physics.chargeStrength);
          }
          setForcesConfigured(true);
        }
        const linkForce = fgRef.current.d3Force("link");
        if (linkForce && typeof linkForce.distance === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          linkForce.distance(graphConstants.physics.linkDistance);
        }

        const centerForce = fgRef.current.d3Force("center");
        if (centerForce && typeof centerForce.strength === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          centerForce.strength(graphConstants.physics.centerForceStrength);
        }

        fgRef.current.tickFrame();
      }

      const time = clock.getElapsedTime();
      const pulsateOpacity = ((Math.sin(time * 3) + 1) / 2) * 0.7 + 0.5; // Oscillates between 0.3 and 1

      props.graphData.nodes.forEach((node) => {
        if (node.nodeType === "signal" && node.__threeObj) {
          const mesh = node.__threeObj as THREE.Mesh;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (mesh.material && "opacity" in mesh.material) {
            (mesh.material as THREE.MeshLambertMaterial).opacity =
              pulsateOpacity;
          }
        }
      });
    });

    const { handleNodeClick } = useGraphInteractions(
      props.graphData,
      props.onNodeClick,
      props.selectedNodeId,
    );

    const formatedData = useMemo(() => {
      return {
        nodes: props.graphData.nodes,
        links: props.graphData.links,
      };
    }, [props.graphData.nodes, props.graphData.links]);

    const nodeThreeObject = useMemo(() => {
      return (node: NodeObject) => {
        const customNode = node as CustomGraphNode;
        const baseColor = String(
          node.color ?? graphConstants.nodeConfig.nodeColors.default,
        );

        let color = baseColor;
        if (
          props.userAddress &&
          String(node.id).toLowerCase() === props.userAddress.toLowerCase()
        ) {
          color = graphConstants.nodeConfig.nodeColors.userNode;
        }

        const material = new THREE.MeshLambertMaterial({
          color: color,
          opacity: 1,
          transparent: customNode.nodeType === "signal",
        });

        let geometry: THREE.BufferGeometry;

        switch (customNode.nodeType) {
          case "signal": {
            const config = graphConstants.nodeConfig.nodeGeometry.signalNode;
            geometry = new THREE.TetrahedronGeometry(
              config.radius,
              config.detail,
            );
            break;
          }
          case "permission": {
            const config =
              graphConstants.nodeConfig.nodeGeometry.permissionNode;
            geometry = new THREE.IcosahedronGeometry(
              config.radius,
              config.detail,
            );
            break;
          }
          case "allocator": {
            const config = graphConstants.nodeConfig.nodeGeometry.allocator;
            geometry = new THREE.SphereGeometry(
              config.radius,
              config.widthSegments,
              config.heightSegments,
            );
            break;
          }
          case "root_agent": {
            const config = graphConstants.nodeConfig.nodeGeometry.rootNode;
            geometry = new THREE.SphereGeometry(
              config.radius,
              config.widthSegments,
              config.heightSegments,
            );
            break;
          }

          case "target_agent":
          default: {
            const config = graphConstants.nodeConfig.nodeGeometry.targetNode;
            geometry = new THREE.SphereGeometry(
              config.radius,
              config.widthSegments,
              config.heightSegments,
            );
            break;
          }
        }

        return new THREE.Mesh(geometry, material);
      };
    }, [props.userAddress]);

    return (
      <>
        <R3fForceGraph
          ref={fgRef}
          graphData={formatedData}
          nodeThreeObject={nodeThreeObject}
          linkDirectionalParticleWidth={
            graphConstants.linkConfig.particleConfig.particleWidth
          }
          linkDirectionalParticles={(link: LinkObject) =>
            Number(link.linkDirectionalParticles) || 0
          }
          linkDirectionalParticleSpeed={(link: LinkObject) =>
            Number(link.linkDirectionalParticleSpeed) ||
            graphConstants.linkConfig.particleConfig.speed
          }
          linkDirectionalArrowLength={(link: LinkObject) =>
            Number(link.linkDirectionalArrowLength)
          }
          linkDirectionalArrowRelPos={(link: LinkObject) =>
            Number(link.linkDirectionalArrowRelPos)
          }
          linkCurvature={(link: LinkObject) => Number(link.linkCurvature)}
          linkColor={(link: LinkObject) => String(link.linkColor)}
          linkWidth={(link: LinkObject) => Number(link.linkWidth) || 1}
          onNodeClick={handleNodeClick}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.graphData === nextProps.graphData &&
      prevProps.onNodeClick === nextProps.onNodeClick &&
      prevProps.userAddress === nextProps.userAddress &&
      prevProps.selectedNodeId === nextProps.selectedNodeId
    );
  },
);

export default ForceGraph;
