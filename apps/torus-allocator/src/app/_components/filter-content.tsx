import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { SearchIcon } from "lucide-react";

interface FilterProps {
  defaultValue: string;
}

export const Filter = ({ defaultValue = "" }: FilterProps) => {
  return (
    <form action="/" method="get" className="w-full">
      <div className="flex w-full items-center gap-2">
        <Label
          htmlFor="search-bar"
          className="rounded-radius flex w-full max-w-sm flex-1 items-center justify-center border pl-3"
        >
          <SearchIcon size={16} className="text-muted-foreground" />
          <Input
            id="search-bar"
            name="search"
            placeholder="Search agents by name or key"
            className="border-none focus-visible:ring-0"
            defaultValue={defaultValue}
          />
          <input type="hidden" name="page" value="1" />
        </Label>

        <Button type="submit" variant="outline" className="py-[1.3em]">
          Search
        </Button>

        {defaultValue && (
          <div className="text-sm">
            Showing results for:{" "}
            <span className="font-semibold">{defaultValue}</span>
            <a href="/" className="ml-2 text-blue-500 hover:underline">
              Clear
            </a>
          </div>
        )}
      </div>
    </form>
  );
};
