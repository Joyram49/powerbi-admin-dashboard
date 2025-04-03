"use client";

import type { ColumnDef } from "@tanstack/react-table";
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

interface Admin {
  id: string;
  userName: string;
}

interface Company {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  dateJoined: string;
  status: "active" | "inactive" | "suspended" | "pending";
  lastActivity: string | null;
  modifiedBy: string;
  employeeCount: number;
  reportCount: number;
  admin: Admin;
}

export const columns: ColumnDef<Company>[] = [
  {
    id: "select",
    header: ({ table }) => (
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
    cell: ({ row }) => (
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
      const { id }: { id: string } = row.original;
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
      <div className="text-center">{row.original.companyName}</div>
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
    header: () => <div className="text-center font-medium">Created At</div>,
    cell: ({ row }) => new Date(row.original.dateJoined).toLocaleDateString(),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center font-medium">Status</div>,
    cell: ({ row }) => <div className="text-center">{row.original.status}</div>,
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
              onClick={() => navigator.clipboard.writeText(company.admin.id)}
              className="hover:dark:bg-slate-900"
            >
              Copy Company Admin ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:dark:bg-slate-900">
              View customer
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:dark:bg-slate-900">
              View payment details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
