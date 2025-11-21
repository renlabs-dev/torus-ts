import { Button } from "@torus-ts/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@torus-ts/ui/components/empty";
import { ArrowUpRightIcon, ScanSearch } from "lucide-react";

export function SearchEmpty() {
  return (
    <Empty className="!p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ScanSearch />
        </EmptyMedia>
        <EmptyTitle>Start typing to search for predictors</EmptyTitle>
        <EmptyDescription>
          The swarm will display the predictor profile and metrics.
        </EmptyDescription>
      </EmptyHeader>

      <Button
        variant="link"
        asChild
        className="text-muted-foreground"
        size="sm"
      >
        <a href="https://blog.predictionswarm.com/" target="_blank">
          Learn More <ArrowUpRightIcon />
        </a>
      </Button>
    </Empty>
  );
}
