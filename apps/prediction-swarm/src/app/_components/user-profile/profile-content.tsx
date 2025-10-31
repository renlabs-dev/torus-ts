import type { AppRouter } from "@torus-ts/api";
import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import type { inferProcedureOutput } from "@trpc/server";
import { ProfileFeed } from "./profile-feed";

type PredictionData = inferProcedureOutput<
  AppRouter["prediction"]["getByUsername"]
>;

interface ProfileContentProps {
  predictions: PredictionData;
}

export default function ProfileContent({ predictions }: ProfileContentProps) {
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
    <Card className="bg-background/80 plus-corners">
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
            <ProfileFeed predictions={ongoingPredictions} variant="user" />
          </CardContent>
        </TabsContent>

        {/* True Predictions */}
        <TabsContent value="true">
          <CardContent>
            <ProfileFeed predictions={truePredictions} variant="user" />
          </CardContent>
        </TabsContent>

        {/* False Predictions */}
        <TabsContent value="false">
          <CardContent>
            <ProfileFeed predictions={falsePredictions} variant="user" />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
