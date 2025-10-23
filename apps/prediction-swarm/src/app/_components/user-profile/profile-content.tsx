import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";

export default function ProfileContent() {
  return (
    <Card className="bg-background/80 backdrop-blur-lg">
      <Tabs defaultValue="personal" className="space-y-6">
        <CardHeader>
          <TabsList className="bg-accent/60 grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
        </CardHeader>

        {/* Personal Information */}
        <TabsContent value="personal" className="space-y-6">
          <CardContent className="space-y-6">x</CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
