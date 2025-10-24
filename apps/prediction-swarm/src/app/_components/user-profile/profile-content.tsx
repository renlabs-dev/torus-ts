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
  return (
    <Card className="bg-background/80 backdrop-blur-lg">
      <Tabs defaultValue="ongoing">
        <CardHeader className="pb-0">
          <TabsList className="bg-accent/60 grid w-full grid-cols-3">
            <TabsTrigger value="ongoing">Ongoing predictions</TabsTrigger>
            <TabsTrigger value="true">True predictions</TabsTrigger>
            <TabsTrigger value="false">False predictions</TabsTrigger>
          </TabsList>
        </CardHeader>

        {/* Ongoing Predictions */}
        <TabsContent value="ongoing">
          <CardContent>
            <ProfileFeed predictions={predictions} variant="user" />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
