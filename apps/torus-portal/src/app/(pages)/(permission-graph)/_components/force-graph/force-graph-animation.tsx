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

    useFrame(() => {
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

        if (customNode.precomputedGeometry && customNode.precomputedMaterial) {
          if (
            props.userAddress &&
            String(node.id).toLowerCase() === props.userAddress.toLowerCase()
          ) {
            const userMaterial =
              customNode.precomputedMaterial.clone() as THREE.MeshLambertMaterial;
            userMaterial.color.setHex(
              parseInt(
                graphConstants.nodeConfig.nodeColors.userNode.replace("#", ""),
                16,
              ),
            );
            return new THREE.Mesh(customNode.precomputedGeometry, userMaterial);
          }

          return new THREE.Mesh(
            customNode.precomputedGeometry,
            customNode.precomputedMaterial,
          );
        }

        let color = node.color as string;
        if (
          props.userAddress &&
          String(node.id).toLowerCase() === props.userAddress.toLowerCase()
        ) {
          color = graphConstants.nodeConfig.nodeColors.userNode;
        }

        const material = new THREE.MeshLambertMaterial({
          color: color,
          opacity: 1,
        });

        const geometry = new THREE.SphereGeometry(10, 16, 16);
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
            Number(link.linkDirectionalArrowLength) ||
            graphConstants.linkConfig.arrowConfig.defaultArrowLength
          }
          linkDirectionalArrowRelPos={(link: LinkObject) =>
            Number(link.linkDirectionalArrowRelPos) ||
            graphConstants.linkConfig.arrowConfig.defaultArrowRelPos
          }
          linkCurvature={(link: LinkObject) => Number(link.linkCurvature)}
          linkColor={(link: LinkObject) => String(link.linkColor)}
          linkWidth={(link: LinkObject) =>
            Number(link.linkWidth) || graphConstants.linkConfig.linkWidth
          }
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
