import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { Search } from "lucide-react";
import { useId } from "react";

export function SearchProphet() {
  const id = useId();

  return (
    <div className="w-full max-w-lg space-y-2 text-center">
      <div className="shadow-xs flex rounded-full">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-6 top-1/2 z-10 h-5 w-5 -translate-y-1/2" />
          <Input
            id={id}
            type="email"
            placeholder="Search for any x account"
            className="focus-visible:z-1 -me-px h-12 rounded-l-full rounded-r-none bg-transparent pl-14 shadow-none backdrop-blur-xl"
          />
        </div>
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
