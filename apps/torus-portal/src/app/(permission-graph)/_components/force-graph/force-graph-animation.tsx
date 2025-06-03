"use client";

import { memo, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type { NodeObject, LinkObject, GraphMethods } from "r3f-forcegraph";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import { useGraphInteractions } from "./use-graph-interactions";
import {
  getNodeColor,
  getLinkParticles,
  getLinkWidth,
} from "./force-graph-highlight-utils";
import { GRAPH_CONSTANTS } from "./force-graph-constants";
import { useFrame } from "@react-three/fiber";

const R3fForceGraph = dynamic(() => import("r3f-forcegraph"), { ssr: false });

interface ForceGraphProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
}

const ForceGraph = memo(
  function ForceGraph(props: ForceGraphProps) {
    const fgRef = useRef<GraphMethods | undefined>(undefined);

    useFrame(() => {
      if (fgRef.current?.d3Force) {
        const linkForce = fgRef.current.d3Force("link");
        if (linkForce && typeof linkForce.distance === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          linkForce.distance(GRAPH_CONSTANTS.LINK_DISTANCE);
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
      <R3fForceGraph
        ref={fgRef}
        graphData={formatedData}
        nodeOpacity={GRAPH_CONSTANTS.NODE_OPACITY}
        nodeColor={(node: NodeObject) =>
          getNodeColor(node, highlightState, props.userAddress)
        }
        linkDirectionalParticleResolution={GRAPH_CONSTANTS.NODE_RESOLUTION}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticles={(link: LinkObject) =>
          getLinkParticles(link, highlightState)
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
        nodeResolution={GRAPH_CONSTANTS.NODE_RESOLUTION}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
      />
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
