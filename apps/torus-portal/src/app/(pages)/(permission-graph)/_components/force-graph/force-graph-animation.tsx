"use client";

import { memo, useMemo, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import dynamic from "next/dynamic";
import type { GraphMethods, LinkObject, NodeObject } from "r3f-forcegraph";

import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import { GRAPH_CONSTANTS } from "./force-graph-constants";
import { getLinkWidth, getNodeColor } from "./force-graph-highlight-utils";
import { useGraphInteractions } from "./use-graph-interactions";

const R3fForceGraph = dynamic(() => import("r3f-forcegraph"), { ssr: false });

interface ForceGraphProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
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
            chargeForce.strength(GRAPH_CONSTANTS.CHARGE_STRENGTH);
          }
          setForcesConfigured(true);
        }
        const linkForce = fgRef.current.d3Force("link");
        if (linkForce && typeof linkForce.distance === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          linkForce.distance(GRAPH_CONSTANTS.LINK_DISTANCE);
        }

        // Add center force to keep nodes from drifting too far
        const centerForce = fgRef.current.d3Force("center");
        if (centerForce && typeof centerForce.strength === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          centerForce.strength(0.1);
        }

        fgRef.current.tickFrame();
      }
    });

    const {
      highlightState,
      handleNodeClick,
      handleNodeHover,
      handleLinkHover,
    } = useGraphInteractions(props.graphData, props.onNodeClick);

    const formatedData = useMemo(() => {
      return {
        nodes: props.graphData.nodes.map((node) => ({
          ...node,
        })),
        links: props.graphData.links.map((link) => ({
          ...link,
        })),
      };
    }, [props.graphData.nodes, props.graphData.links]);

    return (
      <>
        <R3fForceGraph
          ref={fgRef}
          graphData={formatedData}
          nodeOpacity={1}
          nodeColor={(node: NodeObject) =>
            getNodeColor(node, highlightState, props.userAddress)
          }
          linkDirectionalParticleWidth={3}
          linkDirectionalParticles={(link: LinkObject) =>
            Number(link.linkDirectionalParticles) || 0
          }
          linkDirectionalParticleSpeed={(link: LinkObject) =>
            Number(link.linkDirectionalParticleSpeed) || 0.008
          }
          linkDirectionalArrowLength={(link: LinkObject) =>
            Number(link.linkDirectionalArrowLength)
          }
          linkDirectionalArrowRelPos={(link: LinkObject) =>
            Number(link.linkDirectionalArrowRelPos)
          }
          linkCurvature={(link: LinkObject) => Number(link.linkCurvature)}
          linkColor={(link: LinkObject) => String(link.linkColor)}
          linkWidth={(link: LinkObject) => getLinkWidth(link, highlightState)}
          nodeResolution={24}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.graphData === nextProps.graphData &&
      prevProps.onNodeClick === nextProps.onNodeClick &&
      prevProps.userAddress === nextProps.userAddress
    );
  },
);

export default ForceGraph;
