"use client";

import { useCallback, useState } from "react";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../../_components/DataTable";
import useUserReportColumns from "./_components/ReportColumns";

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

export default function UserReportsPage() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay

  // Get columns from our custom hook
  const columns = useUserReportColumns();

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
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">My Reports</h1>
      <DataTable<ReportType, unknown, "reportName" | "dateCreated">
        columns={columns}
        data={reports}
        pagination={{
          pageCount: Math.ceil((reportData?.total ?? 0) / pagination.limit),
          page: pagination.page,
          onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
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
    </div>
  );
}
