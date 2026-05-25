"use client";

import { useQuery } from "@tanstack/react-query";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { CheckCircle, Copy, Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";

interface RelayerStatus {
  configured: boolean;
  address: string | null;
  balance: string | null;
  balanceFormatted: string | null;
  estimatedClaimsRemaining: number | null;
  lowBalance: boolean;
}

function useRelayerStatus() {
  return useQuery({
    queryKey: ["relayerStatus"],
    queryFn: async () => {
      const [error, res] = await tryAsync(fetch("/api/admin"));
      if (error !== undefined) throw error;
      const [jsonError, data] = await tryAsync(
        res.json() as Promise<RelayerStatus>,
      );
      if (jsonError !== undefined) throw jsonError;
      return data;
    },
    refetchInterval: 15_000,
  });
}

export default function AdminPage() {
  const { data, isLoading, isError } = useRelayerStatus();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (data?.address) {
      void navigator.clipboard.writeText(data.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relayer Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isLoading && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            )}

            {isError && (
              <p className="text-destructive text-sm">
                Failed to load relayer status.
              </p>
            )}

            {data !== undefined && !data.configured && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <TriangleAlert className="h-4 w-4" />
                <span>
                  Relayer not configured — set{" "}
                  <code className="font-mono text-xs">RELAYER_PRIVATE_KEY</code>
                </span>
              </div>
            )}

            {data?.configured && data.address && (
              <>
                {data.lowBalance && (
                  <div className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                    Low balance — fund the relayer wallet to continue processing
                    claims.
                  </div>
                )}

                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Address</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs">
                        {data.address.slice(0, 6)}…{data.address.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Copy address"
                      >
                        {copied ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {Number(data.balanceFormatted).toFixed(4)} TORUS
                      </span>
                      {data.lowBalance ? (
                        <Badge variant="destructive" className="text-xs">
                          Low
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          OK
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Est. claims remaining
                    </span>
                    <span className="font-medium">
                      ~{data.estimatedClaimsRemaining?.toLocaleString() ?? "0"}
                    </span>
                  </div>
                </div>

                <div className="border-border border-t pt-3">
                  <p className="text-muted-foreground mb-2 text-xs">
                    Fund relayer wallet
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted flex-1 truncate rounded px-2 py-1 font-mono text-xs">
                      {data.address}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyAddress}
                      className="shrink-0"
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
