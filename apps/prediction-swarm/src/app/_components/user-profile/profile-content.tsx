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
