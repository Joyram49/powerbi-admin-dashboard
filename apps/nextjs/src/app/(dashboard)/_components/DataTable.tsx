"use client";

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search, SlidersHorizontal, X } from "lucide-react";

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

import { DataTableSkeleton } from "./DataTableSkeleton";
import { Pagination } from "./Pagination";

// Generic data table props that can work with any data type
interface DataTableProps<TData, TValue, TSortField extends string> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: {
    pageCount: number;
    page: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void; // Added onPageSizeChange
  };
  sorting: {
    sortBy: TSortField | undefined;
    onSortChange: (sortBy: TSortField) => void;
    sortOptions: TSortField[]; // Available sort options
  };
  search: {
    value: string;
    onChange: (value: string) => void;
  };
  isLoading?: boolean;
  placeholder: string;
  actionButton?: React.ReactNode; // The action button (e.g., CompanyModalButton, UserModalButton)
  pageSize?: number;
  pageSizeOptions?: number[]; // Added page size options array
}

export function DataTable<TData, TValue, TSortField extends string>({
  columns,
  data = [],
  pagination,
  sorting,
  search,
  isLoading = false,
  placeholder,
  actionButton,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
}: DataTableProps<TData, TValue, TSortField>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.pageCount,
    state: {
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize,
      },
      columnVisibility,
      rowSelection,
    },
    meta: {
      sorting,
    },
    onPaginationChange: (updater) => {
      const newState =
        updater instanceof Function
          ? updater({ pageIndex: pagination.page - 1, pageSize })
          : updater;

      if (newState.pageSize !== pageSize && pagination.onPageSizeChange) {
        pagination.onPageSizeChange(newState.pageSize);
      } else {
        pagination.onPageChange(newState.pageIndex + 1);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
  });

  const selectedRowsCount = Object.keys(rowSelection).length;

  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={pageSize}
        searchable={!!search}
        filterable={true}
        actionButton={!!actionButton}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              className="w-full border-slate-900/10 bg-white pl-8 dark:border-white/10 dark:bg-slate-900"
            />
            {search.value && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2"
                onClick={() => search.onChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {selectedRowsCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedRowsCount} row{selectedRowsCount > 1 ? "s" : ""} selected
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actionButton}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-x-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[200px] dark:bg-slate-800"
            >
              <div className="p-2 text-sm font-medium">Toggle columns</div>
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
      <div className="w-full overflow-auto rounded-md border-[1px] border-slate-200 drop-shadow-sm dark:border-slate-700">
        <Table className="border-collapse bg-gray-50">
          <TableHeader className="dark:border-slate-70 border-slate-200 bg-gray-50 dark:bg-slate-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-slate-200 hover:bg-transparent dark:border-slate-700"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap border-slate-200 font-medium dark:border-slate-700"
                  >
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
          <TableBody className="bg-gray-50 dark:bg-slate-800">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="border-slate-200 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:hover:bg-slate-700/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="break-words border-slate-200 dark:border-slate-700"
                    >
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
                  className="h-24 border-slate-200 text-center dark:border-slate-700"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <span>No data found</span>
                    </div>
                    {search.value && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => search.onChange("")}
                        className="text-muted-foreground"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
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
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={pagination.onPageSizeChange}
        pageSize={pageSize}
        showSelectedRowsCount={true}
        showPageSizeSelector={true}
      />
    </div>
  );
}
