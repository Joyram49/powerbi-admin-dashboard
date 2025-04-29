"use client";

import type { Column, ColumnDef, Row, Table } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { ArrowUpDown, ExternalLinkIcon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";

import type { ReportType } from "~/app/(dashboard)/super-admin/reports/_components/update-report-form";
import { EntityActions } from "~/app/(dashboard)/_components/EntityActions";
import ReportViewer from "~/app/(dashboard)/_components/ReportViewer";
import { api } from "~/trpc/react";
import AdminReportModal from "./AdminReportModal";

interface TableMeta {
  sorting?: {
    onSortChange: (sortBy: "reportName" | "dateCreated") => void;
  };
}

export function useReportColumns() {
  // Hook calls inside the custom hook
  const utils = api.useUtils();

  // State for report viewer
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<ReportType | null>(null);

  const openReportDialog = (report: ReportType) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
  };

  const closeReportDialog = () => {
    setIsDialogOpen(false);
    // Small delay to allow animation to complete
    setTimeout(() => setSelectedReport(null), 300);
  };

  const columns = useMemo<ColumnDef<ReportType, unknown>[]>(() => {
    return [
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
        accessorKey: "reportUrl",
        header: () => <div className="text-center font-medium">Report URL</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openReportDialog(row.original)}
              className="mx-auto flex cursor-pointer items-center space-x-1 border border-primary/90 bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              <span>Open</span>
            </Button>
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
          <div className="text-center">{row.original.userCounts ?? 0}</div>
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
          const report = row.original;
          return (
            <div className="flex items-center">
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
                    setReportToEdit(report);
                    setIsEditModalOpen(true);
                  },
                }}
              />

              {/* Edit Modal - Rendered conditionally when edit is clicked */}
              {isEditModalOpen && reportToEdit?.id === report.id && (
                <AdminReportModal
                  reportId={report.id}
                  isOpen={isEditModalOpen}
                  setIsOpen={setIsEditModalOpen}
                  onClose={() => {
                    setIsEditModalOpen(false);
                    setReportToEdit(null);
                  }}
                />
              )}
            </div>
          );
        },
      },
    ];
  }, [isEditModalOpen, reportToEdit]);

  return {
    columns,
    ReportViewer,
    isDialogOpen,
    selectedReport,
    closeReportDialog,
    isEditModalOpen,
    setIsEditModalOpen,
    reportToEdit,
    setReportToEdit,
  };
}

export default useReportColumns;
