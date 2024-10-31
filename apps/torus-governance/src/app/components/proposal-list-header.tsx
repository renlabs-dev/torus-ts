"use client";

import { Link } from "lucide-react";

import { toast } from "@torus-ts/providers/use-toast";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils";

import { CreateModal } from "./modal";
import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from "react";
import { useTorus } from "@torus-ts/providers/use-torus";

const viewModes = ["proposals", "daos"]

export function ProposalListHeader(): JSX.Element {
  const { daoTreasury } = useTorus();
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const viewMode = useMemo(() => searchParams.get('view') ?? '', [searchParams]);

  const updateView = useCallback((newView: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleViewChange = useCallback((value: string) => {
    if (value !== viewMode && viewModes.includes(value)) {
      updateView(value);
    }
  }, [viewMode, updateView]);

  useEffect(() => {
    if (!viewModes.includes(viewMode)) {
      updateView('proposals');
    }
  }, [viewMode, updateView]);

  return (
    <div className="mt-10 flex w-full flex-row justify-between gap-6 divide-gray-500 lg:mt-0 lg:max-w-screen-2xl lg:pt-5">
      <div
        className={`hidden w-full animate-fade-down flex-col justify-end gap-1 animate-delay-300 lg:flex`}
      >
        <Label className="text-md">DAO treasury address:</Label>
        <Button onClick={handleCopyClick} size="xl">
          {daoTreasury ? (
            <span className="flex text-pretty">
              <Link className="mr-2 h-5 w-5" />
              {smallAddress(daoTreasury)}
            </span>
          ) : (
            <span className="flex animate-pulse text-pretty">
              <Link className="mr-2 h-5 w-5" />
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
