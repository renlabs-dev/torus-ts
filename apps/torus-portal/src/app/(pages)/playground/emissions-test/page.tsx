"use client";

import { Alert, AlertDescription } from "@torus-ts/ui/components/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Separator } from "@torus-ts/ui/components/separator";
import { Skeleton } from "@torus-ts/ui/components/skeleton";

import { useAccountEmissions } from "~/hooks/use-account-emissions";

const TEST_ACCOUNT = "5E2X371Jg62WWmKVVhDNgfFNtjXTSKMQDGGWKgqimKUgZ9gX";

export default function EmissionsTestPage() {
  const emissions = useAccountEmissions({
    accountId: TEST_ACCOUNT,
  });

  if (emissions.isLoading) {
    return <LoadingState />;
  }

  if (emissions.isError) {
    return <ErrorState />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Account Emissions Test</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Account</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm bg-muted p-2 rounded">{TEST_ACCOUNT}</code>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Total Weekly Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {emissions.displayValues.agentNetworkEmission}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {emissions.emissions.total.percentage.toFixed(4)}% of network
            emissions
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Root Emissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">
                {emissions.displayValues.rootEmission}
              </div>
              <p className="text-sm text-muted-foreground">
                {emissions.emissions.root.percentage.toFixed(4)}% of network
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stream Emissions (Net)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">
                {emissions.displayValues.netStreams}
              </div>
              <p className="text-sm text-muted-foreground">
                {emissions.emissions.streams.net.percentage.toFixed(4)}% of
                network
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Stream Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Incoming Streams</p>
                <p className="text-sm text-muted-foreground">
                  {emissions.emissions.streams.incoming.count} streams
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  +{emissions.displayValues.incomingStreams}
                </p>
                <p className="text-sm text-muted-foreground">
                  {emissions.emissions.streams.incoming.percentage.toFixed(4)}%
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Outgoing Streams</p>
                <p className="text-sm text-muted-foreground">
                  {emissions.emissions.streams.outgoing.count} streams
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">
                  -{emissions.displayValues.outgoingStreams}
                </p>
                <p className="text-sm text-muted-foreground">
                  {emissions.emissions.streams.outgoing.percentage.toFixed(4)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {emissions.hasCalculatingStreams && (
        <Alert className="mt-6">
          <AlertDescription>
            Some streams are still being calculated. Values may update.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(emissions, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Account Emissions Test</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Account Emissions Test</h1>
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load emissions data. Please check the console for errors.
        </AlertDescription>
      </Alert>
    </div>
  );
}
