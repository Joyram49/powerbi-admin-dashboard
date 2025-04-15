"use client";

import type { Column, ColumnDef, Row, Table } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";

import type { ReportType } from "./ReportForm";
import { EntityActions } from "~/app/(dashboard)/_components/EntityActions";
import { api } from "~/trpc/react";
import ReportForm from "./ReportForm";

// Status color mapping for better UI
const STATUS_COLORS = {
  active: "text-green-600",
  inactive: "text-gray-500",
};

interface TableMeta {
  sorting?: {
    onSortChange: (sortBy: "reportName" | "dateCreated") => void;
  };
}

export function useReportColumns() {
  // Hook calls inside the custom hook
  const utils = api.useUtils();
  const deleteMutation = api.report.deleteReport.useMutation();

  return useMemo(() => {
    const columns: ColumnDef<ReportType>[] = [
      {
        id: "select",
        header: ({ table }: { table: Table<ReportType> }) => (
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
        cell: ({ row }: { row: Row<ReportType> }) => (
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
        header: () => <div className="text-left font-medium">Report ID</div>,
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
        accessorKey: "reportName",
        header: ({
          column,
          table,
        }: {
          column: Column<ReportType>;
          table: Table<ReportType>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <Button
              variant="ghost"
              onClick={() => {
                if (sorting?.onSortChange) {
                  sorting.onSortChange("reportName");
                } else {
                  column.toggleSorting(column.getIsSorted() === "asc");
                }
              }}
              className="text-center font-medium"
            >
              Report Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-center font-semibold">
            {row.original.reportName}
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: () => <div className="text-center font-medium">Company</div>,
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.company?.companyName ?? "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "userCount",
        header: () => <div className="text-center font-medium"># Users</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.original.userCount ?? 0}</div>
        ),
      },
      {
        accessorKey: "accessCount",
        header: () => <div className="text-center font-medium"># Accesses</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.original.accessCount ?? 0}</div>
        ),
      },
      {
        accessorKey: "dateCreated",
        header: ({
          column,
          table,
        }: {
          column: Column<ReportType>;
          table: Table<ReportType>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <Button
              variant="ghost"
              className="text-center font-medium"
              onClick={() => {
                // If sorting is available, use it
                if (sorting?.onSortChange) {
                  sorting.onSortChange("dateCreated");
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
            {row.original.dateCreated
              ? new Date(row.original.dateCreated).toLocaleDateString()
              : "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "lastModifiedAt",
        header: () => (
          <div className="text-center font-medium">Last Modified</div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.lastModifiedAt
              ? new Date(row.original.lastModifiedAt).toLocaleDateString()
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
            <div
              className={`text-center font-semibold ${
                status ? STATUS_COLORS[status] : "text-gray-500"
              }`}
            >
              {status
                ? status.charAt(0).toUpperCase() + status.slice(1)
                : "N/A"}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const report = row.original;
          return (
            <EntityActions<ReportType>
              entity={report}
              entityName="Report"
              entityDisplayField="reportName"
              copyActions={[
                { label: "Copy Report ID", field: "id" },
                { label: "Copy Report URL", field: "reportUrl" },
              ]}
              editAction={{
                onEdit: () => {
                  // This is handled by EntityActions component
                },
                editForm: (
                  <ReportForm
                    initialData={report}
                    onClose={async () => {
                      // Close the modal and refresh the data
                      await utils.report.getAllReports.invalidate();
                      await utils.report.getAllReportsForCompany.invalidate();
                      await utils.report.getAllReportsAdmin.invalidate();
                    }}
                    userRole="superAdmin"
                  />
                ),
              }}
              deleteAction={{
                onDelete: async () => {
                  await deleteMutation.mutateAsync({ reportId: report.id });
                  await utils.report.getAllReports.invalidate();
                  await utils.report.getAllReportsForCompany.invalidate();
                  await utils.report.getAllReportsAdmin.invalidate();
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

export default useReportColumns;
