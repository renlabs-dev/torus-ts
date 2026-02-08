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
import { formatToken } from "@torus-network/torus-utils/torus";
import type { Prospect } from "@torus-ts/db/schema";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { RenaissanceButton } from "../renaissance-button";
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
import { SubmissionActionsDropdown } from "./submission-actions-dropdown";

type ApprovalStatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";

const APPROVAL_STATUS_OPTIONS: {
  value: ApprovalStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All Submissions" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const approvalStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
};

function truncateAddress(address: string | null): string {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface SubmissionsTableMeta {
  isApostle: boolean;
}

const submissionColumns: ColumnDef<Prospect>[] = [
  {
    accessorKey: "xHandle",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="renaissance-ghost-btn"
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
    accessorKey: "proposerWalletAddress",
    header: "Proposer",
    cell: ({ row }) => {
      const address = row.original.proposerWalletAddress;
      return (
        <span className="font-mono text-sm" title={address ?? undefined}>
          {truncateAddress(address)}
        </span>
      );
    },
  },
  {
    accessorKey: "proposerStakeSnapshot",
    header: "Stake",
    cell: ({ row }) => {
      const stake = row.original.proposerStakeSnapshot;
      if (!stake) return <span className="text-muted-foreground">-</span>;
      return (
        <span className="font-mono text-sm">
          {formatToken(BigInt(stake))} TORUS
        </span>
      );
    },
  },
  {
    accessorKey: "approvalStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.approvalStatus;
      const colorClass =
        approvalStatusColors[status] ?? approvalStatusColors.PENDING;
      return <Badge className={`renaissance-badge ${colorClass}`}>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="renaissance-ghost-btn"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Submitted
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
    cell: ({ row, table }) => {
      const meta = table.options.meta as SubmissionsTableMeta | undefined;
      if (!meta?.isApostle) return null;
      return (
        <SubmissionActionsDropdown
          prospect={row.original}
          isApostle={meta.isApostle}
        />
      );
    },
  },
];

export function CommunitySubmissionsTable() {
  const [statusFilter, setStatusFilter] =
    useState<ApprovalStatusFilter>("PENDING");
  const [sorting, setSorting] = useState<SortingState>([]);
  const { isApostle } = useIsApostle();

  const { data: prospects, isLoading } =
    api.apostleSwarm.listProspects.useQuery(
      {
        approvalStatus: statusFilter === "all" ? undefined : statusFilter,
        limit: 100,
      },
      {
        placeholderData: keepPreviousData,
      },
    );

  // Filter to only show community submissions (origin: COMMUNITY)
  const communitySubmissions = useMemo(
    () => prospects?.filter((p) => p.origin === "COMMUNITY") ?? [],
    [prospects],
  );

  const table = useReactTable({
    data: communitySubmissions,
    columns: submissionColumns,
    meta: { isApostle } as SubmissionsTableMeta,
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
          onValueChange={(value) =>
            setStatusFilter(value as ApprovalStatusFilter)
          }
        >
          <SelectTrigger className="renaissance-select-trigger w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="renaissance-select-content">
            {APPROVAL_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="renaissance-panel">
        <span className="renaissance-panel-bottom-corners" />
        <Table>
          <TableHeader className="renaissance-table-header">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="renaissance-table-row">
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
              <TableRow className="renaissance-table-row">
                <TableCell
                  colSpan={submissionColumns.length}
                  className="renaissance-table-cell h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="renaissance-table-row">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="renaissance-table-cell">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="renaissance-table-row">
                <TableCell
                  colSpan={submissionColumns.length}
                  className="renaissance-table-cell h-24 text-center"
                >
                  No community submissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <div className="renaissance-count flex-1">
          {table.getFilteredRowModel().rows.length} submission(s)
        </div>
        <RenaissanceButton
          variant="secondary"
          size="default"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </RenaissanceButton>
        <RenaissanceButton
          variant="secondary"
          size="default"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </RenaissanceButton>
      </div>
    </div>
  );
}
