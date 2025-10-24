import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { ProfileFeed } from "~/app/_components/user-profile/profile-feed";
import { api } from "~/trpc/server";

export default async function FeedPage() {
  const predictions = await api.prediction.getFeed({
    limit: 50,
  });

  // Filter predictions by verdict status
  const ongoingPredictions = predictions.filter(
    (p) => !p.verdictConclusion || p.verdictConclusion.length === 0,
  );

  const truePredictions = predictions.filter((p) => {
    if (!p.verdictConclusion || p.verdictConclusion.length === 0) return false;
    const feedback = p.verdictConclusion[0]?.feedback.toLowerCase() ?? "";
    return feedback.includes("true") || feedback.includes("correct");
  });

  const falsePredictions = predictions.filter((p) => {
    if (!p.verdictConclusion || p.verdictConclusion.length === 0) return false;
    const feedback = p.verdictConclusion[0]?.feedback.toLowerCase() ?? "";
    return !feedback.includes("true") && !feedback.includes("correct");
  });

  return (
    <div className="mx-auto max-w-screen-lg space-y-6 px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Prediction Feed</h1>
        <p className="text-muted-foreground mt-2">
          View predictions from all tracked users
        </p>
      </div>

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
  );
}
