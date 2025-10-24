import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { ProfileFeed } from "./profile-feed";

export default function ProfileContent() {
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
            <ProfileFeed />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
