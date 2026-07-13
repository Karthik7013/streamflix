"use client";

import { useReactTable, getCoreRowModel, flexRender, SortingState, type ColumnDef } from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  manualSorting?: boolean;
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "No data found.",
  sorting,
  onSortingChange,
  manualSorting = true,
  skeletonRows = 5,
}: DataTableProps<T>) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting,
    state: { sorting },
    onSortingChange: onSortingChange as never,
    enableSorting: true,
    enableMultiSort: false,
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    className={cn(
                      "px-6 py-4 whitespace-nowrap",
                      canSort && "cursor-pointer select-none hover:text-foreground transition-colors"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        {
                          asc: <ArrowUp className="size-3" />,
                          desc: <ArrowDown className="size-3" />,
                        }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="size-3 opacity-30" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y">
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col, j) => (
                    <td key={col.id ?? j} className="px-6 py-4 first:w-48 last:w-20">
                       <Skeleton className="h-5 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              )
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );
}
