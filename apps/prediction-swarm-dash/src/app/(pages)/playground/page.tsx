"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui/components/tabs";
import {
  useAgentContributionStatsQuery,
  usePredictionsQuery,
  useSwarmTotalMetrics,
} from "~/hooks/api";
import { useState } from "react";

function JsonViewer({ data, isLoading, error }: {
  data: unknown;
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive">
        <p className="font-semibold">Error:</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <pre className="p-4 rounded-md bg-muted overflow-auto max-h-[600px] text-xs">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function PredictionsQueryExample() {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = usePredictionsQuery({
    limit,
    offset,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="limit">Limit</Label>
          <Input
            id="limit"
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="offset">Offset</Label>
          <Input
            id="offset"
            type="number"
            min={0}
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={() => setOffset(offset + limit)}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Endpoint:</strong> <code>predictions/list</code>
        </p>
        <p>
          <strong>Hook:</strong> <code>usePredictionsQuery</code>
        </p>
        <p className="mt-2">
          Query predictions from the database with pagination support.
        </p>
      </div>

      <JsonViewer data={data} isLoading={isLoading} error={error} />
    </div>
  );
}

function AgentStatsQueryExample() {
  const [agentAddress, setAgentAddress] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, error } = useAgentContributionStatsQuery({
    agent_address: agentAddress || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="agentAddress">Agent Address (optional)</Label>
          <Input
            id="agentAddress"
            type="text"
            value={agentAddress}
            onChange={(e) => setAgentAddress(e.target.value)}
            placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from">From (ISO datetime, optional)</Label>
            <Input
              id="from"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value ? new Date(e.target.value).toISOString() : "")}
            />
          </div>
          <div>
            <Label htmlFor="to">To (ISO datetime, optional)</Label>
            <Input
              id="to"
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value ? new Date(e.target.value).toISOString() : "")}
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Endpoint:</strong> <code>agent-contribution-stats</code>
        </p>
        <p>
          <strong>Hook:</strong> <code>useAgentContributionStatsQuery</code>
        </p>
        <p className="mt-2">
          Query agent contribution statistics with optional time window filtering.
        </p>
      </div>

      <JsonViewer data={data} isLoading={isLoading} error={error} />
    </div>
  );
}

function SwarmMetricsQueryExample() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const metrics = useSwarmTotalMetrics({
    from: from || undefined,
    to: to || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="metrics-from">From (ISO datetime, optional)</Label>
          <Input
            id="metrics-from"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value ? new Date(e.target.value).toISOString() : "")}
          />
        </div>
        <div>
          <Label htmlFor="metrics-to">To (ISO datetime, optional)</Label>
          <Input
            id="metrics-to"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value ? new Date(e.target.value).toISOString() : "")}
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Endpoints:</strong> <code>agent-contribution-stats</code> + <code>permissions/list</code>
        </p>
        <p>
          <strong>Hook:</strong> <code>useSwarmTotalMetrics</code>
        </p>
        <p className="mt-2">
          Aggregated swarm-wide metrics combining multiple data sources.
        </p>
      </div>

      <JsonViewer
        data={metrics}
        isLoading={metrics.isLoading}
        error={metrics.error}
      />
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Query Playground</CardTitle>
          <CardDescription>
            Explore and test database queries with live data from the prediction swarm API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="predictions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="agents">Agent Stats</TabsTrigger>
              <TabsTrigger value="metrics">Swarm Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="mt-6">
              <PredictionsQueryExample />
            </TabsContent>

            <TabsContent value="agents" className="mt-6">
              <AgentStatsQueryExample />
            </TabsContent>

            <TabsContent value="metrics" className="mt-6">
              <SwarmMetricsQueryExample />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
