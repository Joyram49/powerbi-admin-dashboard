"use client";

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2, SlidersHorizontal } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import CompanyModalButton from "../../_components/CompanyModal";
import { Pagination } from "../../_components/Pagination";

interface DataTableProps<TData extends Company, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: {
    pageCount: number;
    page: number;
    onPageChange: (page: number) => void;
  };
  sorting: {
    sortBy: "companyName" | "dateJoined";
    onSortChange: (sortBy: "companyName" | "dateJoined") => void;
  };
  search: {
    value: string;
    onChange: (value: string) => void;
  };
  isLoading?: boolean;
}

export function DataTable<TData extends Company, TValue>({
  columns,
  data = [],
  pagination,
  sorting,
  search,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // We don't need client-side sorting and filtering anymore
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Using manual pagination since we'll handle it server-side
    manualPagination: true,
    pageCount: pagination.pageCount,
    state: {
      pagination: {
        pageIndex: pagination.page - 1, // TanStack uses 0-indexed pages
        pageSize: 10,
      },
      columnVisibility,
      rowSelection,
    },
    meta: {
      sorting,
    },
    onPaginationChange: (updater) => {
      // Only manage page selection server-side
      const newState =
        updater instanceof Function
          ? updater({ pageIndex: pagination.page - 1, pageSize: 10 })
          : updater;
      pagination.onPageChange(newState.pageIndex + 1);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
  });

  return (
    <div>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center py-4">
          <Input
            placeholder="Search for company by name..."
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            className="max-w-sm bg-white"
          />
        </div>
        <div className="flex items-center gap-4">
          <CompanyModalButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-x-2 dark:bg-slate-900"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-slate-800">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize hover:dark:bg-slate-900"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border-[1px] border-slate-900/10 drop-shadow-sm dark:border-white/10">
        <Table className="rounded-md hover:bg-transparent">
          <TableHeader className="bg-white hover:bg-transparent dark:bg-slate-800">
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
          <TableBody className="bg-gray-50 hover:bg-gray-200">
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pageCount}
        onPageChange={pagination.onPageChange}
        pageSizeOptions={[10, 20, 30, 40, 50]}
        onPageSizeChange={(size) => table.setPageSize(size)}
        showSelectedRowsCount={false}
      />
    </div>
  );
}
