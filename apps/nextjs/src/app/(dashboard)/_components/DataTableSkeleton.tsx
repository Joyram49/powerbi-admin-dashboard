import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Skeleton } from "@acme/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

interface DataTableSkeletonProps {
  columnCount: number;
  rowCount?: number;
  searchable?: boolean;
  filterable?: boolean;
  actionButton?: boolean;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  searchable = true,
  filterable = true,
  actionButton = true,
}: DataTableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative w-full max-w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Skeleton className="h-9 w-full pl-8" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actionButton && <Skeleton className="h-9 w-[100px]" />}
          {filterable && (
            <Button
              variant="outline"
              className="flex items-center gap-x-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900"
              disabled
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          )}
        </div>
      </div>
      <div className="w-full overflow-auto rounded-md border-[1px] border-slate-200 drop-shadow-sm dark:border-slate-700">
        <Table className="border-collapse bg-gray-50">
          <TableHeader className="dark:border-slate-70 border-slate-200 bg-gray-50 dark:bg-slate-800">
            <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-700">
              {Array.from({ length: columnCount }).map((_, index) => (
                <TableHead
                  key={index}
                  className="whitespace-nowrap border-slate-200 font-medium dark:border-slate-700"
                >
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-gray-50 dark:bg-slate-800">
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow
                key={rowIndex}
                className="border-slate-200 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:hover:bg-slate-700/50"
              >
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className="break-words border-slate-200 dark:border-slate-700"
                  >
                    <Skeleton className="h-6 w-full animate-pulse bg-slate-400" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[100px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </div>
    </div>
  );
}
