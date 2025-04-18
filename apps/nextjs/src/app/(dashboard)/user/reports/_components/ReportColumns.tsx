'use client';

import { Badge } from "@acme/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";





interface ReportType {
  reportId: string;
  reportName: string;
  reportUrl: string;
  dateCreated: Date | null;
  lastModifiedAt: Date | null;
  status: "active" | "inactive" | null;
  accessCount: number | null;
  userCount: number;
  company: {
    id: string;
    companyName: string;
  } | null;
}




export default function useUserReportColumns() {
  return useMemo(() => {
    const columns: ColumnDef<ReportType>[] = [
      {
        accessorKey: "reportId",
        header: () => <div className="text-left font-medium">Report ID</div>,
        cell: ({ row }) => {
          const { reportId } = row.original;
          return (
            <div className="text-left">
              <span className="hidden xl:inline">{reportId}</span>
              <span className="xl:hidden">{reportId.slice(0, 10)}...</span>
            </div>
          );
        },
      },
      {
        accessorKey: "reportName",
        header: () => (
          <div className="text-center font-medium">Report Name</div>
        ),
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
        accessorKey: "accessCount",
        header: () => <div className="text-center font-medium"># Accesses</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.original.accessCount ?? 0}</div>
        ),
      },
      {
        accessorKey: "dateCreated",
        header: () => <div className="text-center font-medium">Created At</div>,
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.dateCreated
              ? new Date(row.original.dateCreated).toLocaleDateString()
              : "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center font-medium">Status</div>,
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
        accessorKey: "reportUrl",
        header: () => <div className="text-center font-medium">Actions</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <a
              href={row.original.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Report
            </a>
          </div>
        ),
      },
    ];

    return columns;
  }, []);
}