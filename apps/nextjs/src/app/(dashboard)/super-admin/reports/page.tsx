"use client";

import { useCallback, useState } from "react";

import type { ReportType } from "./_components/ReportForm";
import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../../_components/DataTable";
import useReportColumns from "./_components/ReportColumns";
import ReportModalButton from "./_components/ReportModal";

export default function ReportsDashboard() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay
  const [sortBy, setSortBy] = useState<"reportName" | "dateCreated">();
  const columns = useReportColumns();
  const { data } = api.auth.getProfile.useQuery();
  const userRole = data?.user?.user_metadata.role as string;

  const { data: reportData, isLoading } = api.report.getAllReports.useQuery(
    {
      searched: debouncedSearch,
      sortBy: sortBy,
      page: pagination.page,
      limit: pagination.limit,
    },
    {
      enabled: userRole === "superAdmin",
    },
  );

  // Extract actual report data array from the response
  const reports = reportData?.data ?? [];

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
      <DataTable<ReportType, unknown, "reportName" | "dateCreated">
        columns={columns}
        data={reports}
        pagination={{
          pageCount:
            reportData?.total && reportData.limit
              ? Math.ceil(reportData.total / reportData.limit)
              : 0,
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
        placeholder="Search reports..."
        actionButton={<ReportModalButton />}
        isLoading={isLoading}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
