"use client";

import { useState } from "react";

import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { toast } from "@torus-ts/ui/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { api } from "~/trpc/react";

export default function StreamsReceivedTestPage() {
  const [accountId, setAccountId] = useState("");
  const [inputValue, setInputValue] = useState("");

  const streamsReceivedQuery = api.permission.streamsReceived.useQuery(
    { accountId },
    {
      enabled: !!accountId,
    },
  );

  // Handle errors with useEffect
  if (streamsReceivedQuery.isError) {
    console.error(
      "Error fetching streams received:",
      streamsReceivedQuery.error,
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      toast.error("Please enter an account ID");
      return;
    }

    setAccountId(inputValue.trim());
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(4)}%`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Streams Received Test</CardTitle>
          <CardDescription>
            Test the streamsReceived procedure to see delegated stream
            percentages for an account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="accountId">Account ID (SS58 Address)</Label>
              <Input
                id="accountId"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter SS58 address..."
                disabled={streamsReceivedQuery.isFetching}
                className="font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!inputValue.trim() || streamsReceivedQuery.isFetching}
            >
              {streamsReceivedQuery.isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                "Fetch Streams Received"
              )}
            </Button>
          </form>

          {streamsReceivedQuery.data && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Results</h3>

              {Object.keys(streamsReceivedQuery.data).length === 0 ? (
                <p className="text-muted-foreground">
                  No streams found for this account
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(streamsReceivedQuery.data).map(
                    ([grantor, permissions]) => (
                      <div key={grantor} className="space-y-4">
                        <div>
                          <h4 className="font-medium">Grantor:</h4>
                          <p className="text-xs font-mono text-muted-foreground break-all">
                            {grantor}
                          </p>
                        </div>

                        {Object.entries(permissions).map(
                          ([permissionId, streams]) => (
                            <Card key={permissionId} className="p-4">
                              <h5 className="font-medium mb-2">
                                Permission ID:
                              </h5>
                              <p className="text-xs font-mono text-muted-foreground mb-3 break-all">
                                {permissionId}
                              </p>

                              <div className="space-y-2">
                                {Object.entries(streams).map(
                                  ([streamId, percentage]) => (
                                    <div
                                      key={streamId}
                                      className="flex justify-between items-start gap-4"
                                    >
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">
                                          Stream ID:
                                        </p>
                                        <p className="text-xs font-mono text-muted-foreground break-all">
                                          {streamId}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium">
                                          Delegated %
                                        </p>
                                        <p className="text-lg font-mono">
                                          {formatPercentage(percentage)}
                                        </p>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </Card>
                          ),
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          {streamsReceivedQuery.isError && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">
                  Error: {streamsReceivedQuery.error.message}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
