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
import {
  disposePrecomputedGeometries,
  disposePrecomputedMaterials,
  getHypergraphFlowNodes,
} from "./force-graph-utils";
import { useGraphInteractions } from "./use-graph-interactions";

const R3fForceGraph = dynamic(() => import("r3f-forcegraph"), { ssr: false });

interface ForceGraphProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  selectedNodeId?: string | null;
  allocatorAddress: string;
}

const ForceGraph = memo(
  function ForceGraph(props: ForceGraphProps) {
    const fgRef = useRef<GraphMethods | undefined>(undefined);
    const materialsRef = useRef<Set<THREE.Material>>(new Set());
    const geometriesRef = useRef<Set<THREE.BufferGeometry>>(new Set());

    const [forcesConfigured, setForcesConfigured] = useState(false);
    const lastHoveredNodeRef = useRef<NodeObject | null>(null);

    // Track connected nodes for opacity control
    const connectedNodesRef = useRef<Set<string>>(new Set());
    const nodeObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map());

    // Update connected nodes when selectedNodeId changes
    useEffect(() => {
      if (props.selectedNodeId) {
        const flowNodes = getHypergraphFlowNodes(
          props.selectedNodeId,
          props.graphData.nodes,
          props.graphData.links,
          props.allocatorAddress,
        );
        connectedNodesRef.current = flowNodes;
      } else {
        connectedNodesRef.current = new Set();
      }

      // Update opacity of existing node materials
      nodeObjectsRef.current.forEach((mesh, nodeId) => {
        const material = mesh.material as THREE.MeshLambertMaterial;
        const isSelected =
          props.selectedNodeId && nodeId === props.selectedNodeId;
        const isConnected = connectedNodesRef.current.has(nodeId);
        const hasSelection =
          props.selectedNodeId !== null && props.selectedNodeId !== undefined;

        let opacity = 1.0;
        if (hasSelection && !isSelected && !isConnected) {
          opacity = 0.1;
        }

        material.transparent = true;
        material.opacity = opacity;
        material.needsUpdate = true;
      });
    }, [
      props.selectedNodeId,
      props.graphData.links,
      props.graphData.nodes,
      props.allocatorAddress,
    ]);

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

        // Clear node objects map
        // eslint-disable-next-line react-hooks/exhaustive-deps
        nodeObjectsRef.current.clear();

        // Dispose shared geometries and materials
        disposePrecomputedGeometries();
        disposePrecomputedMaterials();
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
        const nodeId = String(node.id);

        // Determine initial opacity based on selection state
        const isSelected =
          props.selectedNodeId && nodeId === props.selectedNodeId;
        const isConnected = connectedNodesRef.current.has(nodeId);
        const hasSelection =
          props.selectedNodeId !== null && props.selectedNodeId !== undefined;

        let opacity = 1.0;
        if (hasSelection && !isSelected && !isConnected) {
          opacity = 0.2; // Dim unconnected nodes
        }

        let mesh: THREE.Mesh;

        if (customNode.precomputedGeometry && customNode.precomputedMaterial) {
          const material =
            customNode.precomputedMaterial.clone() as THREE.MeshLambertMaterial;

          if (
            props.userAddress &&
            String(node.id).toLowerCase() === props.userAddress.toLowerCase()
          ) {
            material.color.setHex(
              parseInt(
                graphConstants.nodeConfig.nodeColors.userNode.replace("#", ""),
                16,
              ),
            );
          }

          material.transparent = true;
          material.opacity = opacity;
          materialsRef.current.add(material);
          mesh = new THREE.Mesh(customNode.precomputedGeometry, material);
        } else {
          let color = node.color as string;
          if (
            props.userAddress &&
            String(node.id).toLowerCase() === props.userAddress.toLowerCase()
          ) {
            color = graphConstants.nodeConfig.nodeColors.userNode;
          }

          const material = new THREE.MeshLambertMaterial({
            color: color,
            opacity: opacity,
            transparent: true,
          });
          materialsRef.current.add(material);

          const geometry = new THREE.SphereGeometry(10, 16, 16);
          geometriesRef.current.add(geometry);
          mesh = new THREE.Mesh(geometry, material);
        }

        // Store reference for later updates
        nodeObjectsRef.current.set(nodeId, mesh);
        return mesh;
      };
    }, [props.selectedNodeId, props.userAddress]);

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
          linkColor={(link: LinkObject) => {
            const linkColor = String(link.linkColor);
            const hasSelection =
              props.selectedNodeId !== null &&
              props.selectedNodeId !== undefined;

            if (hasSelection) {
              const sourceId =
                typeof link.source === "string"
                  ? link.source
                  : typeof link.source === "object"
                    ? String(link.source.id)
                    : "";
              const targetId =
                typeof link.target === "string"
                  ? link.target
                  : typeof link.target === "object"
                    ? String(link.target.id)
                    : "";

              const isSourceConnected = connectedNodesRef.current.has(sourceId);
              const isTargetConnected = connectedNodesRef.current.has(targetId);

              if (!isSourceConnected || !isTargetConnected) {
                // Convert hex color to rgba with low opacity
                const hex = linkColor.replace("#", "");
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, 0.1)`;
              }
            }

            return linkColor;
          }}
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
