"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";

import type { ReportType } from "@acme/db/schema";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import ReportViewer from "~/app/(dashboard)/_components/ReportViewer";

export default function useUserReportColumns() {
  // State for report viewer
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openReportDialog = (report: ReportType) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
  };

  const closeReportDialog = () => {
    setIsDialogOpen(false);
    // Small delay to allow animation to complete
    setTimeout(() => setSelectedReport(null), 300);
  };

  const columns: ColumnDef<ReportType>[] = useMemo(() => {
    const columns: ColumnDef<ReportType>[] = [
      {
        accessorKey: "reportId",
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
        header: () => (
          <div className="text-center font-medium"># Report Views</div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.original.accessCount || 0}</div>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                openReportDialog({
                  ...row.original,
                  id: row.original.id, // Map reportId to id for ReportViewer
                } as unknown as ReportType)
              }
              className="mx-auto flex cursor-pointer items-center space-x-1 border border-primary/90 bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              <span>Open</span>
            </Button>
          </div>
        ),
      },
    ];

    return columns;
  }, []);

  return {
    columns,
    ReportViewer,
    isDialogOpen,
    selectedReport,
    closeReportDialog,
  };
}
