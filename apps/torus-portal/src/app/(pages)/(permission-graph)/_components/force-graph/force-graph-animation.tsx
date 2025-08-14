"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import dynamic from "next/dynamic";
import type { GraphMethods, LinkObject, NodeObject } from "r3f-forcegraph";
import * as THREE from "three";

import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import { graphConstants } from "./force-graph-constants";
import { disposePrecomputedGeometries } from "./force-graph-utils";
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
    const materialsRef = useRef<Set<THREE.Material>>(new Set());
    const geometriesRef = useRef<Set<THREE.BufferGeometry>>(new Set());

    const [forcesConfigured, setForcesConfigured] = useState(false);
    const lastHoveredNodeRef = useRef<NodeObject | null>(null);

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

    // Cleanup materials and geometries on unmount
    useEffect(() => {
      return () => {
        // Dispose all tracked materials
        materialsRef.current.forEach((material) => {
          material.dispose();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        materialsRef.current.clear();

        // Dispose all tracked geometries
        geometriesRef.current.forEach((geometry) => {
          geometry.dispose();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        geometriesRef.current.clear();

        // Dispose shared geometries
        disposePrecomputedGeometries();
      };
    }, []);

    const { handleNodeClick } = useGraphInteractions(
      props.graphData,
      props.onNodeClick,
      props.selectedNodeId,
    );

    const handleNodeHover = (node: NodeObject | null) => {
      if (lastHoveredNodeRef.current) {
        const prevMesh = lastHoveredNodeRef.current.__threeObj as THREE.Mesh;
        const prevMaterial = prevMesh.material as THREE.MeshLambertMaterial;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (prevMaterial.emissive) {
          prevMaterial.emissive.setHex(0x000000);
        }
      }

      if (node) {
        const mesh = node.__threeObj as THREE.Mesh;
        const material = mesh.material as THREE.MeshLambertMaterial;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (material.emissive) {
          material.emissive.setHex(0x444444);
        }
      }

      lastHoveredNodeRef.current = node;
    };

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
            materialsRef.current.add(userMaterial);
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
        materialsRef.current.add(material);

        const geometry = new THREE.SphereGeometry(10, 16, 16);
        geometriesRef.current.add(geometry);
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
          linkDirectionalArrowLength={(link: LinkObject) => {
            const targetNode = link.target as CustomGraphNode;
            if (targetNode.nodeType === "permission") {
              return 0;
            }
            return (
              Number(link.linkDirectionalArrowLength) ||
              graphConstants.linkConfig.arrowConfig.defaultArrowLength
            );
          }}
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
          onNodeHover={handleNodeHover}
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
