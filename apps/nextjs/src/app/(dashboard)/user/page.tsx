"use client";

import { useCallback, useState } from "react";

import type { ReportType } from "@acme/db/schema";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../_components/DataTable";
import { DataTableSkeleton } from "../_components/DataTableSkeleton";
import useUserReportColumns from "./_components/ReportColumns";

export default function UserReportsPage() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay

  // Get columns from our custom hook
  const {
    columns,
    ReportViewer,
    isDialogOpen,
    selectedReport,
    closeReportDialog,
  } = useUserReportColumns();

  // Fetch user's reports
  const { data: reportData, isLoading } = api.report.getAllReportsUser.useQuery(
    {
      searched: debouncedSearch,
      page: pagination.page,
      limit: pagination.limit,
    },
  );

  // Extract actual report data array from the response
  const reports = reportData?.reports ?? [];

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination({
      limit: newPageSize,
      page: 1, // Reset to first page when changing page size
    });
  }, []);

  return (
    <div className="container mx-auto max-w-[98%] py-10">
      <h1 className="mb-8 text-3xl font-bold">My Reports</h1>
      {isLoading ? (
        <DataTableSkeleton
          columnCount={columns.length}
          rowCount={pagination.limit}
          searchable={true}
          filterable={false}
          actionButton={false}
        />
      ) : (
        <DataTable<ReportType, unknown, "reportName" | "dateCreated">
          columns={columns}
          data={reports}
          pagination={{
            pageCount: Math.ceil((reportData?.total ?? 0) / pagination.limit),
            page: pagination.page,
            onPageChange: (page) =>
              setPagination((prev) => ({ ...prev, page })),
            onPageSizeChange: handlePageSizeChange,
          }}
          sorting={{
            sortBy: undefined,
            onSortChange: (_sortField) => {
              // Sorting disabled for users
              return;
            },
            sortOptions: ["reportName", "dateCreated"],
          }}
          search={{
            value: searchInput,
            onChange: handleSearchChange,
          }}
          isLoading={isLoading}
          placeholder="Search reports..."
          pageSize={pagination.limit}
        />
      )}
      {isDialogOpen && selectedReport && (
        <ReportViewer
          isOpen={isDialogOpen}
          onClose={closeReportDialog}
          report={{
            ...selectedReport,
            id: selectedReport.id,
          }}
        />
      )}
    </div>
  );
}
