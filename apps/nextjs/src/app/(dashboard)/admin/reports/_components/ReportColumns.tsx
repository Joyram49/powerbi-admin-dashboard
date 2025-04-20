"use client";

import type { Column, ColumnDef, Table } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

interface ReportType {
  id: string;
  reportName: string;
  reportUrl: string;
  dateCreated: Date | null;
  lastModifiedAt: Date | null;
  status: "active" | "inactive" | null;
  accessCount: number | null;
  userCounts: number;
  company: {
    id: string;
    companyName: string;
  } | null;
}

interface TableMeta {
  sorting?: {
    onSortChange: (sortBy: "reportName" | "dateCreated") => void;
  };
}

export function useReportColumns() {
  return useMemo(() => {
    const columns: ColumnDef<ReportType, unknown>[] = [
      {
        accessorKey: "reportName",
        header: ({
          column,
          table,
        }: {
          column: Column<ReportType, unknown>;
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
        accessorKey: "userCounts",
        header: () => <div className="text-center font-medium"># Users</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.original.userCounts || 0}</div>
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
          column: Column<ReportType, unknown>;
          table: Table<ReportType>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <Button
              variant="ghost"
              className="text-center font-medium"
              onClick={() => {
                if (sorting?.onSortChange) {
                  sorting.onSortChange("dateCreated");
                } else {
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
            <Badge
              variant={status === "active" ? "success" : "destructive"}
              className="justify-center"
            >
              {(status as string) || "N/A"}
            </Badge>
          );
        },
      },
    ];

    return columns;
  }, []);
}

export default useReportColumns;
