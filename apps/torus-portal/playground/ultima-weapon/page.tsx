"use client";

import { useState } from "react";
import SuperJSON from "superjson";

import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@torus-ts/ui/components/card";

import { api } from "~/trpc/react";

// Types for the API responses
type StreamData = Record<string, number | null>;
type PermissionStreamData = Record<string, StreamData>;
type AccountStreamData = {
  incoming: PermissionStreamData;
  outgoing: PermissionStreamData;
};
type StreamsByTargetData = Record<string, { streamIds: string[]; normalizedWeight: number }>;

// Simple JSON Visualizer Component
function JsonVisualizer({ data, title }: { data: unknown; title: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const toggleExpanded = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const renderValue = (value: unknown, path: string): React.ReactNode => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined) return <span className="text-gray-500">undefined</span>;
    if (typeof value === "string") return <span className="text-green-600">"{value}"</span>;
    if (typeof value === "number") return <span className="text-blue-600">{value}</span>;
    if (typeof value === "boolean") return <span className="text-purple-600">{value.toString()}</span>;
    
    if (Array.isArray(value)) {
      const isExpanded = expanded[path] ?? false;
      return (
        <div>
          <button 
            onClick={() => toggleExpanded(path)}
            className="text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            [{value.length}] {isExpanded ? "▼" : "▶"}
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-2 mt-1">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500">{index}:</span>{" "}
                  {renderValue(item, `${path}.${index}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (typeof value === "object" && value !== null) {
      const isExpanded = expanded[path] ?? true; // Objects expanded by default
      const keys = Object.keys(value as Record<string, unknown>);
      return (
        <div>
          <button 
            onClick={() => toggleExpanded(path)}
            className="text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            {`{${keys.length}}`} {isExpanded ? "▼" : "▶"}
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-2 mt-1">
              {keys.map(objectKey => (
                <div key={objectKey} className="py-1">
                  <span className="text-red-600">"{objectKey}"</span>: {renderValue((value as Record<string, unknown>)[objectKey], `${path}.${objectKey}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
          {renderValue(data, "root")}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UltimaWeaponPage() {
  const [targetAccountId, setTargetAccountId] = useState("5D5FbRRUvQxdQnJLgNW6BdgZ86CRGreKRahzhxmdSj2REBnt");
  const [result, setResult] = useState<StreamsByTargetData | PermissionStreamData | AccountStreamData | { error: string } | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<"both" | "perBlock">("perBlock");


  const bothQuery = api.permission.streamsByAccountWithAccumulations.useQuery(
    { accountId: targetAccountId },
    {
      enabled: false, // Don't auto-fetch
    }
  );

  const perBlockQuery = api.permission.streamsByAccountPerBlock.useQuery(
    { accountId: targetAccountId, lastN: 7 },
    {
      enabled: false, // Don't auto-fetch
    }
  );

  const handleTest = () => {
    console.log("🗡️ Test clicked, current result:", result);
    console.log("🗡️ Target account:", targetAccountId);
    console.log("🗡️ Active endpoint:", activeEndpoint);
    setResult(null);
    
    const queryToUse = activeEndpoint === "both" ? bothQuery : perBlockQuery;
    
    void queryToUse.refetch().then((response) => {
      console.log("🗡️ Refetch response:", response);
      if (response.data) {
        console.log("🗡️ Setting result data:", response.data);
        
        // Special console log for endpoints
        if (activeEndpoint === "both") {
          console.log("🗡️ streamsByAccountWithAccumulations result:");
          const data = response.data as AccountStreamData;
          console.log("  - Incoming streams:", data.incoming);
          console.log("  - Outgoing streams:", data.outgoing);
          console.log("  - Incoming permission count:", Object.keys(data.incoming).length);
          console.log("  - Outgoing permission count:", Object.keys(data.outgoing).length);
          
          // Show details for incoming
          console.log("📥 INCOMING:");
          for (const [permissionId, streams] of Object.entries(data.incoming)) {
            console.log(`  - Permission ${permissionId}:`);
            for (const [streamId, amount] of Object.entries(streams as Record<string, number | null>)) {
              console.log(`    - Stream ${streamId}: ${amount ?? 'null (insufficient data)'}`);
            }
          }
          
          // Show details for outgoing
          console.log("📤 OUTGOING:");
          for (const [permissionId, streams] of Object.entries(data.outgoing)) {
            console.log(`  - Permission ${permissionId}:`);
            for (const [streamId, amount] of Object.entries(streams as Record<string, number | null>)) {
              console.log(`    - Stream ${streamId}: ${amount ?? 'null (insufficient data)'}`);
            }
          }
        } else if (activeEndpoint === "perBlock") {
          console.log("🗡️ streamsByAccountPerBlock result:");
          const data = response.data as AccountStreamData;
          console.log("  - Incoming streams (per block):", data.incoming);
          console.log("  - Outgoing streams (per block):", data.outgoing);
          console.log("  - Incoming permission count:", Object.keys(data.incoming).length);
          console.log("  - Outgoing permission count:", Object.keys(data.outgoing).length);
          
          // Show details for incoming
          console.log("📥 INCOMING (tokens/block):");
          for (const [permissionId, streams] of Object.entries(data.incoming)) {
            console.log(`  - Permission ${permissionId}:`);
            for (const [streamId, rate] of Object.entries(streams as Record<string, number | null>)) {
              console.log(`    - Stream ${streamId}: ${rate === null ? 'null (insufficient data)' : `${rate.toString()} tokens/block`}`);
            }
          }
          
          // Show details for outgoing
          console.log("📤 OUTGOING (tokens/block):");
          for (const [permissionId, streams] of Object.entries(data.outgoing)) {
            console.log(`  - Permission ${permissionId}:`);
            for (const [streamId, rate] of Object.entries(streams as Record<string, number | null>)) {
              console.log(`    - Stream ${streamId}: ${rate === null ? 'null (insufficient data)' : `${rate.toString()} tokens/block`}`);
            }
          }
        }
        
        setResult(response.data);
      } else if (response.error) {
        console.error("🗡️ Refetch error:", response.error);
        setResult({ error: response.error.message });
      }
    }).catch((error: unknown) => {
      console.error("🗡️ Refetch catch error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult({ error: errorMessage });
    });
  };

  const currentQuery = activeEndpoint === "both" ? bothQuery : perBlockQuery;
  console.log("🗡️ Current state - result:", result, "isLoading:", currentQuery.isLoading);
  console.log("🗡️ Result is null?", result === null);
  console.log("🗡️ Active endpoint:", activeEndpoint);

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🗡️ UltimaWeapon</h1>
        <p className="text-muted-foreground">
          Test the streamsByAccountWithAccumulations and streamsByAccountPerBlock API endpoints
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="targetAccount">Target Account ID</Label>
            <Input
              id="targetAccount"
              type="text"
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="font-mono text-sm"
              placeholder="Enter SS58 address..."
            />
          </div>

          <div>
            <Label>API Endpoint</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={activeEndpoint === "both" ? "default" : "outline"}
                onClick={() => setActiveEndpoint("both")}
                size="sm"
              >
                Both (In + Out)
              </Button>
              <Button
                variant={activeEndpoint === "perBlock" ? "default" : "outline"}
                onClick={() => setActiveEndpoint("perBlock")}
                size="sm"
              >
                Per Block
              </Button>
            </div>
          </div>

          <Button
            onClick={handleTest}
            disabled={currentQuery.isLoading}
            className="w-full"
          >
            {currentQuery.isLoading ? "Querying..." : `Test ${activeEndpoint === "both" ? "streamsByAccountWithAccumulations" : "streamsByAccountPerBlock"} API`}
          </Button>

          {currentQuery.isLoading && (
            <div className="text-sm text-blue-600">Loading...</div>
          )}
          

          {result && !('error' in result) && activeEndpoint === "both" && 'incoming' in result && (
            <div className="text-sm text-muted-foreground">
              Incoming: {Object.keys(result.incoming).length} permission(s), 
              Outgoing: {Object.keys(result.outgoing).length} permission(s)
            </div>
          )}

          {result && !('error' in result) && activeEndpoint === "perBlock" && 'incoming' in result && (
            <div className="text-sm text-muted-foreground">
              Per Block - Incoming: {Object.keys(result.incoming).length} permission(s), 
              Outgoing: {Object.keys(result.outgoing).length} permission(s)
            </div>
          )}
        </CardContent>
      </Card>

      {result !== null && (
        <JsonVisualizer 
          data={result} 
          title={`API Results for ${targetAccountId.slice(0, 12)}...`} 
        />
      )}
    </div>
  );
}