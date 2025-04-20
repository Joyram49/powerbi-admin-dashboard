"use client";

import type { Column, ColumnDef, Row, Table } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";

import type { Company } from "~/types/company";
import { api } from "~/trpc/react";
import { EntityActions } from "../../_components/EntityActions";
import CompanyAdminForm from "./CompanyForm";

interface TableMeta {
  sorting?: {
    onSortChange: (sortBy: "companyName" | "dateJoined") => void;
  };
}

export function useCompanyColumns() {
  // Hook calls inside the custom hook
  const utils = api.useUtils();
  const deleteMutation = api.company.deleteCompany.useMutation();

  return useMemo(() => {
    const columns: ColumnDef<Company>[] = [
      {
        id: "select",
        header: ({ table }: { table: Table<Company> }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
        header: ({
          column,
          table,
        }: {
          column: Column<Company>;
          table: Table<Company>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <Button
              variant="ghost"
              onClick={() => {
                if (sorting?.onSortChange) {
                  sorting.onSortChange("companyName");
                } else {
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
        accessorKey: "companyAdmin",
        header: () => <div className="text-center font-medium">Admin</div>,
        cell: ({ row }) => {
          const admin = row.original.admin;
          return (
            <div className="text-center">
              {admin.userName || "Admin not found"}
            </div>
          );
        },
      },
      {
        accessorKey: "companyAddress",
        header: () => <div className="text-center font-medium">Address</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.original.address}</div>
        ),
      },
      {
        accessorKey: "phone",
        header: () => <div className="text-center font-medium">Phone</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.original.phone}</div>
        ),
      },
      {
        accessorKey: "email",
        header: () => <div className="text-center font-medium">Email</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.original.email}</div>
        ),
      },
      {
        accessorKey: "employeeCount",
        header: () => (
          <div className="text-center font-medium"># employees</div>
        ),
        cell: ({ row }) => (
          <Link
            href={`/super-admin/users?companyId=${row.original.id}`}
            className="flex justify-center"
          >
            <Button
              variant="link"
              className="bg-gray-100 text-center dark:bg-gray-800"
            >
              {row.original.employeeCount}
            </Button>
          </Link>
        ),
      },
      {
        accessorKey: "reportCount",
        header: () => <div className="text-center font-medium"># Reports</div>,
        cell: ({ row }) => (
          <Link
            href={`/super-admin/reports?companyId=${row.original.id}`}
            className="flex justify-center"
          >
            <Button
              variant="link"
              className="bg-gray-100 text-center dark:bg-gray-800"
            >
              {row.original.reportCount}
            </Button>
          </Link>
        ),
      },
      {
        accessorKey: "dateJoined",
        header: ({
          column,
          table,
        }: {
          column: Column<Company>;
          table: Table<Company>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <Button
              variant="ghost"
              className="text-center font-medium"
              onClick={() => {
                // If sorting is available, use it
                if (sorting?.onSortChange) {
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
            {row.original.dateJoined
              ? new Date(row.original.dateJoined).toLocaleDateString()
              : "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "lastActivity",
        header: () => (
          <div className="text-center font-medium">Last Activity</div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.lastActivity
              ? new Date(row.original.lastActivity).toLocaleDateString()
              : "N/A"}
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
            <Badge
              variant={status === "active" ? "success" : "destructive"}
              className="justify-center"
            >
              {(status as string) || "N/A"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const company = row.original;
          return (
            <EntityActions<Company>
              entity={company}
              entityName="Company"
              entityDisplayField="companyName"
              copyActions={[
                { label: "Copy Company ID", field: "id" },
                {
                  label: "Copy Company Admin ID",
                  field: (entity) => entity.admin.id,
                },
              ]}
              editAction={{
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onEdit: () => {},
                editForm: (
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  <CompanyAdminForm initialData={company} onClose={() => {}} />
                ),
              }}
              deleteAction={{
                onDelete: async () => {
                  await deleteMutation.mutateAsync({ companyId: company.id });
                  await utils.company.getAllCompanies.invalidate();
                },
              }}
            />
          );
        },
      },
    ];

    return columns;
  }, [deleteMutation, utils]);
}

export default useCompanyColumns;
