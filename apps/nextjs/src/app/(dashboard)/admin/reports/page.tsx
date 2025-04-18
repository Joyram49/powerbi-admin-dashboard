"use client";

import { useCallback, useState } from "react";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../../_components/DataTable";
import { useReportColumns } from "./_components/ReportColumns";

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

export default function AdminReportsPage() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [sortBy, setSortBy] = useState<"reportName" | "dateCreated">(
    "dateCreated",
  );

  // Fetch reports for the admin
  const { data: reportsData, isLoading } =
    api.report.getAllReportsAdmin.useQuery({
      searched: debouncedSearch,
      limit: pagination.limit,
      page: pagination.page,
      sortBy,
    });

  const columns = useReportColumns();

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback(
    (newSortBy: "reportName" | "dateCreated") => {
      setSortBy(newSortBy);
    },
    [],
  );

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination(() => ({
      limit: newPageSize,
      page: 1,
    }));
  }, []);

  return (
    <div className="container mx-auto w-full p-6">
      <DataTable<ReportType, unknown, "reportName" | "dateCreated">
        columns={columns}
        data={reportsData?.reports ?? []}
        pagination={{
          pageCount:
            reportsData?.total && reportsData.limit
              ? Math.ceil(reportsData.total / reportsData.limit)
              : 0,
          page: pagination.page,
          onPageChange: (page: number) =>
            setPagination((prev) => ({ ...prev, page })),
          onPageSizeChange: handlePageSizeChange,
        }}
        sorting={{
          sortBy,
          onSortChange: handleSortChange,
          sortOptions: ["reportName", "dateCreated"],
        }}
        search={{
          value: searchInput,
          onChange: handleSearchChange,
        }}
        isLoading={isLoading}
        placeholder="Search reports..."
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
