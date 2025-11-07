import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@torus-ts/ui/components/alert-dialog";
import { Button } from "@torus-ts/ui/components/button";
import { FilterDatePicker } from "./filter-date-picker";

export function FilterDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Filters</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Filter</AlertDialogTitle>
          <AlertDialogDescription>
            Select the filters you want to apply to your feed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FilterDatePicker />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Filter</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
