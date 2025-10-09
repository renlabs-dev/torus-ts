import { useEffect, useState } from "react";
import { formatAddress } from "@/lib/api-utils";
import { type PolkadotCodec, torusApi } from "@/lib/torus-api";

const CACHE_PREFIX = "agent_name_";

async function fetchAgentName(address: string): Promise<string> {
  if (!address?.trim()) return "Unknown Agent";

  const cacheKey = `${CACHE_PREFIX}${address}`;

  // Check sessionStorage first
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const agentData = await torusApi.getAgentData(address);
    const codec = agentData as PolkadotCodec;

    if (!agentData || codec.isEmpty) {
      const fallback = `Agent ${formatAddress(address)}`;
      sessionStorage.setItem(cacheKey, fallback);
      return fallback;
    }

    let agent: Record<string, unknown> = {};
    if (codec.toHuman) {
      const humanData = codec.toHuman();
      if (humanData && typeof humanData === "object") {
        agent = humanData as Record<string, unknown>;
      }
    }

    const name = agent?.name?.toString()?.trim();
    if (name && name !== "undefined" && name !== "null") {
      sessionStorage.setItem(cacheKey, name);
      return name;
    }

    const fallback = `Agent ${formatAddress(address)}`;
    sessionStorage.setItem(cacheKey, fallback);
    return fallback;
  } catch {
    const fallback = `Agent ${formatAddress(address)}`;
    sessionStorage.setItem(cacheKey, fallback);
    return fallback;
  }
}

export function useAgentName(address: string) {
  const [agentName, setAgentName] = useState<string>(
    `Agent ${formatAddress(address || "Unknown")}`,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address?.trim()) {
      setAgentName("Unknown Agent");
      return;
    }

    const cacheKey = `${CACHE_PREFIX}${address}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      setAgentName(cached);
      return;
    }

    setIsLoading(true);
    fetchAgentName(address)
      .then(setAgentName)
      .finally(() => setIsLoading(false));
  }, [address]);

  const refetch = () => {
    if (!address?.trim()) return;

    const cacheKey = `${CACHE_PREFIX}${address}`;
    sessionStorage.removeItem(cacheKey);

    setIsLoading(true);
    fetchAgentName(address)
      .then(setAgentName)
      .finally(() => setIsLoading(false));
  };

  return { agentName, isLoading, refetch };
}
