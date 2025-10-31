import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { FeedLegend } from "~/app/_components/user-profile/feed-legend";
import { ProfileFeed } from "~/app/_components/user-profile/profile-feed";
import { api } from "~/trpc/server";
import { TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TickerPage({ params }: PageProps) {
  const { slug } = await params;

  // Get all tickers and find the one matching the slug
  const tickers = await api.topic.getTickers();
  const ticker = tickers.find(
    (t) => t.name.toLowerCase() === slug.toLowerCase(),
  );

  if (!ticker) {
    notFound();
  }

  const predictions = await api.prediction.getByTopic({
    topicId: ticker.id,
    limit: 50,
  });

  // Filter grouped tweets by verdict status of the FIRST (highest quality) prediction
  const ongoingPredictions = predictions.filter(
    (tweet) => tweet.predictions[0]?.verdictId === null,
  );

  const truePredictions = predictions.filter(
    (tweet) => tweet.predictions[0]?.verdict === true,
  );

  const falsePredictions = predictions.filter(
    (tweet) => tweet.predictions[0]?.verdict === false,
  );

  return (
    <div className="relative py-10">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <div className="pb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <TrendingUp className="text-primary h-8 w-8" />
            {ticker.name.toUpperCase()} Predictions
          </h1>
          <p className="text-muted-foreground mt-2">
            View all predictions related to {ticker.name.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Full-width horizontal border */}
      <div className="border-border relative my-6 border-t" />

      {/* Legend */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <FeedLegend />
      </div>

      {/* Full-width horizontal border */}
      <div className="border-border relative my-6 border-t" />

      {/* Content section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <Card className="bg-background/80 backdrop-blur-lg">
          <Tabs defaultValue="ongoing">
            <CardHeader className="pb-0">
              <TabsList className="bg-accent/60 grid w-full grid-cols-3">
                <TabsTrigger value="ongoing">
                  Ongoing predictions ({ongoingPredictions.length})
                </TabsTrigger>
                <TabsTrigger value="true">
                  True predictions ({truePredictions.length})
                </TabsTrigger>
                <TabsTrigger value="false">
                  False predictions ({falsePredictions.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Ongoing Predictions */}
            <TabsContent value="ongoing">
              <CardContent>
                <ProfileFeed predictions={ongoingPredictions} variant="feed" />
              </CardContent>
            </TabsContent>

            {/* True Predictions */}
            <TabsContent value="true">
              <CardContent>
                <ProfileFeed predictions={truePredictions} variant="feed" />
              </CardContent>
            </TabsContent>

            {/* False Predictions */}
            <TabsContent value="false">
              <CardContent>
                <ProfileFeed predictions={falsePredictions} variant="feed" />
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Bottom border */}
      <div className="border-border relative mt-10 border-t" />
    </div>
  );
}
