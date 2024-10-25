import { LinkIcon } from "@heroicons/react/20/solid";

import type { SS58Address } from "@commune-ts/types";
import { toast } from "@commune-ts/providers/use-toast";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@commune-ts/ui";
import { smallAddress } from "@commune-ts/utils";

import { CreateModal } from "./modal";

type ViewMode = "proposals" | "daos";

interface ProposalListHeaderProps {
  viewMode: string;
  setViewMode: (mode: "proposals" | "daos") => void;
  daoTreasury: SS58Address | undefined;
}

export function ProposalListHeader(
  props: ProposalListHeaderProps,
): JSX.Element {
  const { setViewMode, viewMode, daoTreasury } = props;

  function handleCopyClick(): void {
    navigator.clipboard
      .writeText(daoTreasury as string)
      .then(() => {
        toast.success("Treasury address copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy treasury address");
      });
  }

  const handleViewChange = (value: string) => {
    setViewMode(value as ViewMode);
  };

  return (
    <div className="mt-10 flex w-full flex-row justify-between gap-6 divide-gray-500 lg:mt-0 lg:max-w-screen-2xl lg:pt-5">
      <div
        className={`hidden w-full animate-fade-down flex-col justify-end gap-1 animate-delay-300 lg:flex`}
      >
        <Label className="text-md">DAO treasury address:</Label>
        <Button onClick={handleCopyClick} size="xl">
          {daoTreasury ? (
            <span className="flex text-pretty">
              <LinkIcon className="mr-2 h-5 w-5" />
              {smallAddress(daoTreasury)}
            </span>
          ) : (
            <span className="flex animate-pulse text-pretty">
              <LinkIcon className="mr-2 h-5 w-5" />
              Loading address...
            </span>
          )}
        </Button>
      </div>
      <div className="flex w-full animate-fade-down flex-col items-start justify-start gap-1 animate-delay-500">
        <Label className="text-md">View mode:</Label>
        <Select value={viewMode} onValueChange={handleViewChange}>
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder="Select view mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proposals">Proposals View</SelectItem>
            <SelectItem value="daos">S2 Applications</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="hidden w-full animate-fade-down flex-col items-start gap-1 animate-delay-700 lg:flex">
        <Label className="text-md">Want to change something:</Label>
        <CreateModal />
      </div>
    </div>
  );
}
