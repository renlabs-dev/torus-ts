import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@torus-ts/ui/components/form";
import { cn } from "@torus-ts/ui/lib/utils";
import { X } from "lucide-react";

interface DeleteCapabilitySegmentSelectorProps {
  selectedPath: { path: string[] };
  watchedSegment: number;
  onSegmentSelect: (index: number) => void;
  isDisabled?: boolean;
}

export function DeleteCapabilitySegmentSelector({
  selectedPath,
  watchedSegment,
  onSegmentSelect,
  isDisabled = false,
}: DeleteCapabilitySegmentSelectorProps) {
  return (
    <FormItem>
      <FormLabel>Select Segment to Delete</FormLabel>
      <FormControl>
        <div className="space-y-4">
          <div className="bg-muted/50 flex flex-wrap items-center rounded-lg border p-4">
            <div className="mr-1 flex items-center font-mono text-sm">
              {selectedPath.path.slice(0, 2).join(".")}
              <span>.</span>
            </div>
            {selectedPath.path.slice(2).map((segment, sliceIndex) => {
              const index = sliceIndex + 2;
              const willBeDeleted =
                watchedSegment > 1 && index >= watchedSegment;

              return (
                <div key={index} className="flex items-center">
                  <div
                    className={cn(
                      "bg-background flex items-center rounded-lg border",
                      willBeDeleted && "border-destructive",
                    )}
                  >
                    <span
                      className={cn(
                        "border-r px-3 py-1 font-mono text-sm",
                        willBeDeleted && "text-destructive border-destructive",
                      )}
                    >
                      {segment}
                    </span>
                    <Button
                      variant={
                        watchedSegment === index ? "destructive" : "ghost"
                      }
                      size="sm"
                      className="rounded-r-md"
                      onClick={() => onSegmentSelect(index)}
                      disabled={isDisabled}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {index < selectedPath.path.length - 1 && (
                    <span className="text-muted-foreground mx-1">.</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </FormControl>
      <FormDescription>
        Click on a segment to select it for deletion. You can only delete
        segments after the agent name.
      </FormDescription>
    </FormItem>
  );
}
