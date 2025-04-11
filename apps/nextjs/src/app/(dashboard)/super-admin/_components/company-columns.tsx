"use client";

import type { ColumnDef, Row, Table } from "@tanstack/react-table";
import React from "react";
import { ArrowUpDown } from "lucide-react";
import { aria } from "tailwindcss/defaultTheme";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";

import { CompanyActions } from "../../_components/CompanyActions";

// Status color mapping for better UI
const STATUS_COLORS = {
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
    header: ({ column, table }) => {
      const { sorting } = table.options.meta ?? {};
      return (
        <Button
          variant="ghost"
          onClick={() => {
            // If sorting is available, use it
            if (sorting.onSortChange) {
              sorting.onSortChange("companyName");
            } else {
              // Fallback to the default column sorting
              column.toggleSorting(column.getIsSorted() === "asc");
            }
          }}
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
      <div className="text-center">
        {row.original.admin.userName || "No Admin"}
      </div>
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
    header: ({ column, table }) => {
      const { sorting } = table.options.meta ?? {};
      return (
        <Button
          variant="ghost"
          className="text-center font-medium"
          onClick={() => {
            // If sorting is available, use it
            if (sorting.onSortChange) {
              sorting.onSortChange("dateJoined");
            } else {
              // Fallback to the default column sorting
              column.toggleSorting(column.getIsSorted() === "asc");
            }
          }}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
        <>
          <CompanyActions company={company} />
        </>
      );
    },
  },
];

export default columns;
