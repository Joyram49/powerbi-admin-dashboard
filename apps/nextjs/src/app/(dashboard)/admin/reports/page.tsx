"use client";

import { useCallback, useState } from "react";

import type { ReportType } from "../../super-admin/reports/_components/ReportForm";
import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../../_components/DataTable";
import useReportColumns from "./_components/AdminReportColumns";

export default function AdminReportsPage() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay
  const [sortBy, setSortBy] = useState<"reportName" | "dateCreated">(
    "dateCreated",
  );

  // Get columns and report viewer from the hook
  const {
    columns,
    ReportViewer,
    isDialogOpen,
    selectedReport,
    closeReportDialog,
  } = useReportColumns();

  // Fetch reports for the admin
  const { data: reportsData, isLoading } =
    api.report.getAllReportsAdmin.useQuery({
      searched: debouncedSearch,
      page: pagination.page,
      limit: pagination.limit,
      sortBy,
    });

  const reports =
    reportsData?.reports.map((report) => ({
      ...report,
      userIds: [],
      userCounts: report.userCounts || 0,
    })) ?? [];

  const total = reportsData?.total ?? 0;
  const pageLimit = reportsData?.limit ?? pagination.limit;

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
    <div className="container mx-auto w-full p-6">
      <h1 className="mb-6 text-2xl font-bold">Admin Reports</h1>
      <DataTable<ReportType, unknown, "reportName" | "dateCreated">
        columns={columns}
        data={reports}
        pagination={{
          pageCount: total && pageLimit ? Math.ceil(total / pageLimit) : 0,
          page: pagination.page,
          onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
          onPageSizeChange: handlePageSizeChange,
        }}
        sorting={{
          sortBy,
          onSortChange: (newSortBy) => setSortBy(newSortBy),
          sortOptions: ["reportName", "dateCreated"],
        }}
        search={{
          value: searchInput,
          onChange: handleSearchChange,
        }}
        placeholder="Search report name..."
        isLoading={isLoading}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />

      {/* Add the Report Viewer component */}
      <ReportViewer
        isOpen={isDialogOpen}
        onClose={closeReportDialog}
        report={selectedReport}
      />
    </div>
  );
}
