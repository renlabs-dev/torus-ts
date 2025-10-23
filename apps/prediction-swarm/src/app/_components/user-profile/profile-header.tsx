import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import { BadgeCheck } from "lucide-react";

export default function ProfileHeader() {
  return (
    <Card className="bg-background/80 backdrop-blur-lg">
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src="https://bundui-images.netlify.app/avatars/08.png"
                alt="Profile"
              />
              <AvatarFallback className="text-2xl">JD</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-2">
            <Badge variant="default">96% Accuracy</Badge>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">John Doe</h1>
              <BadgeCheck className="text-primary size-5" />
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">@johndoe.com</div>
              <div className="flex items-center gap-1">
                <span className="font-bold">3,840</span> Followers
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold">13,840</span> Posts
              </div>
            </div>
          </div>
          {/* TODO: Add filters */}
          <Button variant="default">Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
}
