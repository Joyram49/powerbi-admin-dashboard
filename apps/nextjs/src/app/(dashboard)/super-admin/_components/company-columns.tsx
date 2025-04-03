"use client";

import type { ColumnDef, Row, Table } from "@tanstack/react-table";
import React from "react";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

// Status color mapping for better UI
const STATUS_COLORS: Record<CompanyStatus, string> = {
  active: "text-green-600",
  inactive: "text-gray-500",
  suspended: "text-red-600",
  pending: "text-yellow-600",
};

export const columns: ColumnDef<Company>[] = [
  {
    id: "select",
    header: ({ table }: { table: Table<Company> }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="border border-slate-800 checked:border-blue-500 checked:bg-white dark:border-slate-50 dark:checked:bg-slate-800"
      />
    ),
    cell: ({ row }: { row: Row<Company> }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="border border-slate-800 checked:border-blue-500 checked:bg-white dark:border-slate-50 dark:checked:bg-slate-800"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: () => <div className="text-left font-medium">Company ID</div>,
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <div className="text-left">
          <span className="hidden xl:inline">{id}</span>
          <span className="xl:hidden">{id.slice(0, 10)}...</span>
        </div>
      );
    },
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-center font-medium"
        >
          Company Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center font-semibold">
        {row.original.companyName}
      </div>
    ),
  },
  {
    accessorKey: "admin",
    header: () => <div className="text-center font-medium">Admin</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.original.admin.userName}</div>
    ),
  },
  {
    accessorKey: "employeeCount",
    header: () => <div className="text-center font-medium"># Users</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.original.employeeCount}</div>
    ),
  },
  {
    accessorKey: "reportCount",
    header: () => <div className="text-center font-medium"># Reports</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.original.reportCount}</div>
    ),
  },
  {
    accessorKey: "dateJoined",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center font-medium"
      >
        Created At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        {new Date(row.original.dateJoined).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center font-medium"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className={`text-center font-semibold ${STATUS_COLORS[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="dark:bg-slate-800">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(company.id)}
              className="cursor-pointer hover:dark:bg-slate-900"
            >
              Copy Company ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(company.admin.id)}
              className="cursor-pointer hover:dark:bg-slate-900"
            >
              Copy Company Admin ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer hover:dark:bg-slate-900">
              View company details
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:dark:bg-slate-900">
              View payment details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default columns;
