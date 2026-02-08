"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Apostle } from "@torus-ts/db/schema";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@torus-ts/ui/components/table";
import { api } from "~/trpc/react";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { RenaissanceButton } from "../renaissance-button";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const columns: ColumnDef<Apostle>[] = [
  {
    accessorKey: "walletAddress",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="renaissance-ghost-btn"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Wallet
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const address = row.original.walletAddress;
      return (
        <span className="font-mono text-sm" title={address}>
          {truncateAddress(address)}
        </span>
      );
    },
  },
  {
    accessorKey: "xHandle",
    header: "X Handle",
    cell: ({ row }) => {
      const handle = row.original.xHandle;
      if (!handle) return <span className="text-muted-foreground">-</span>;
      return (
        <a
          href={`https://x.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          @{handle}
        </a>
      );
    },
  },
  {
    accessorKey: "displayName",
    header: "Display Name",
    cell: ({ row }) => {
      const name = row.original.displayName;
      return name ?? <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "isAdmin",
    header: "Role",
    cell: ({ row }) => {
      const isAdmin = row.original.isAdmin;
      return isAdmin ? (
        <Badge className="renaissance-badge border-red-500/30 bg-red-500/20 text-red-400">
          Admin
        </Badge>
      ) : (
        <Badge className="renaissance-badge border-purple-500/30 bg-purple-500/20 text-purple-400">
          Apostle
        </Badge>
      );
    },
  },
  {
    accessorKey: "weight",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="renaissance-ghost-btn"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Weight
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const weight = row.original.weight;
      return <span className="font-mono">{weight}</span>;
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
        Joined
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return <span>{new Date(date).toLocaleDateString()}</span>;
    },
  },
];

export function ApostlesTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: apostles, isLoading } =
    api.apostleSwarm.listApostles.useQuery();

  const table = useReactTable({
    data: apostles ?? [],
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
                  colSpan={columns.length}
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
                  colSpan={columns.length}
                  className="renaissance-table-cell h-24 text-center"
                >
                  No apostles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <div className="renaissance-count flex-1">
          {table.getFilteredRowModel().rows.length} apostle(s)
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
