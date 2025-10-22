import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { useId } from "react";

export function SearchProphet() {
  const id = useId();

  return (
    <div className="w-full max-w-lg space-y-2 text-center">
      <div className="shadow-xs flex rounded-full">
        <Input
          id={id}
          type="email"
          placeholder="Search for any x account"
          className="focus-visible:z-1 -me-px h-12 rounded-l-full rounded-r-none bg-transparent pl-6 shadow-none backdrop-blur-xl"
        />
        <Button size="lg" className="h-12 rounded-l-none rounded-r-full">
          ASK SWARM
        </Button>
      </div>
      <Label htmlFor={id} className="text-muted-foreground text-sm">
        View prediction history, current and account breakdown
      </Label>
    </div>
  );
}
