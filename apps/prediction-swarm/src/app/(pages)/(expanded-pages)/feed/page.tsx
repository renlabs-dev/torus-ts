import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { PageHeader } from "~/app/_components/page-header";
import { FeedLegend } from "~/app/_components/user-profile/feed-legend";
import { ProfileFeed } from "~/app/_components/user-profile/profile-feed";
import { api } from "~/trpc/server";

export default async function FeedPage() {
  const predictions = await api.prediction.getFeed({
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
    <div className="relative pt-4">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}
      <PageHeader
        title="Prediction Feed"
        description="View predictions from all tracked users"
      />

      {/* Full-width horizontal border */}
      <div className="border-border relative my-4 border-t" />

      {/* Legend */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <FeedLegend />
      </div>

      {/* Full-width horizontal border */}
      <div className="border-border relative my-4 border-t" />

      {/* Content section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <Card className="bg-background/80 plus-corners relative backdrop-blur-lg">
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
