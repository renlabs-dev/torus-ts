import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/fetch";

interface StreamAgentsResponse {
  agent_addresses: string[];
}

interface StreamAgentsData {
  agentAddresses: string[];
  totalAgentsInStream: number;
  isLoading: boolean;
  error: Error | null;
}

const DEFAULT_STREAM_ID =
  "0x1e3a46555c704698c6484ea3388134d590525cd8a6cc95f479420ce56fc5a346";

async function fetchStreamAgents(
  streamId: string,
): Promise<StreamAgentsResponse> {
  return apiFetch<StreamAgentsResponse>(`streams/${streamId}/agents`);
}

export function useStreamAgentsQuery(
  streamId: string = DEFAULT_STREAM_ID,
  options: { enabled?: boolean } = {},
): StreamAgentsData {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stream-agents", streamId],
    queryFn: () => fetchStreamAgents(streamId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 30_000, // 30 seconds
    retry: 3,
    enabled: options.enabled ?? true,
  });

  return {
    agentAddresses: data?.agent_addresses || [],
    totalAgentsInStream: data?.agent_addresses?.length || 0,
    isLoading,
    error,
  };
}
