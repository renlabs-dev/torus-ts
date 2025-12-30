"use client";

import { keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Apostle, Prospect } from "@torus-ts/db/schema";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@torus-ts/ui/components/table";
import { useIsApostle } from "~/hooks/use-is-apostle";
import { api } from "~/trpc/react";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { ProspectActionsDropdown } from "./prospect-actions-dropdown";

type ClaimStatusFilter =
  | "all"
  | "UNCLAIMED"
  | "CLAIMED"
  | "CONVERTED"
  | "FAILED";

const CLAIM_STATUS_OPTIONS: { value: ClaimStatusFilter; label: string }[] = [
  { value: "all", label: "All Prospects" },
  { value: "UNCLAIMED", label: "Unclaimed" },
  { value: "CLAIMED", label: "Claimed" },
  { value: "CONVERTED", label: "Converted" },
  { value: "FAILED", label: "Failed" },
];

const qualityTagColors: Record<string, string> = {
  UNRATED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  HIGH_POTENTIAL: "bg-green-500/20 text-green-400 border-green-500/30",
  MID_POTENTIAL: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  LOW_POTENTIAL: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  BAD_PROSPECT: "bg-red-500/20 text-red-400 border-red-500/30",
};

const claimStatusColors: Record<string, string> = {
  UNCLAIMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CLAIMED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CONVERTED: "bg-green-500/20 text-green-400 border-green-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface ApostleInfo {
  isApostle: boolean;
  isAdmin: boolean;
  apostle: Apostle | null;
}

function createColumns(apostleInfo: ApostleInfo): ColumnDef<Prospect>[] {
  return [
    {
      accessorKey: "xHandle",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          X Handle
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <a
          href={`https://x.com/${row.original.xHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          @{row.original.xHandle}
        </a>
      ),
    },
    {
      accessorKey: "qualityTag",
      header: "Quality",
      cell: ({ row }) => {
        const tag = row.original.qualityTag;
        const colorClass = qualityTagColors[tag] ?? qualityTagColors.UNRATED;
        return <Badge className={colorClass}>{tag.replace("_", " ")}</Badge>;
      },
    },
    {
      accessorKey: "claimStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.claimStatus;
        const colorClass =
          claimStatusColors[status] ?? claimStatusColors.UNCLAIMED;
        return <Badge className={colorClass}>{status}</Badge>;
      },
    },
    {
      accessorKey: "resonanceScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const score = row.original.resonanceScore;
        return score !== null ? (
          <span className="font-mono">{parseFloat(score).toFixed(1)}/10</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return <span>{new Date(date).toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <ProspectActionsDropdown
          prospect={row.original}
          isApostle={apostleInfo.isApostle}
          isAdmin={apostleInfo.isAdmin}
          apostle={apostleInfo.apostle}
        />
      ),
    },
  ];
}

export function ProspectsTable() {
  const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const { isApostle, isAdmin, apostle } = useIsApostle();

  const columns = useMemo(
    () => createColumns({ isApostle, isAdmin, apostle }),
    [isApostle, isAdmin, apostle],
  );

  const { data: prospects, isLoading } =
    api.apostleSwarm.listProspects.useQuery(
      {
        approvalStatus: "APPROVED",
        claimStatus: statusFilter === "all" ? undefined : statusFilter,
        limit: 100,
      },
      {
        placeholderData: keepPreviousData,
      },
    );

  const table = useReactTable({
    data: prospects ?? [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ClaimStatusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {CLAIM_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No prospects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredRowModel().rows.length} prospect(s)
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
