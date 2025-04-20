"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { ReportType } from "./_components/ReportForm";
import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../../_components/DataTable";
import useReportColumns from "./_components/ReportColumns";
import ReportModalButton from "./_components/ReportModal";

export default function ReportsDashboard() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");

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

  const [pageTitle, setPageTitle] = useState("All Reports");

  // Set page title based on if we're filtering by company
  useEffect(() => {
    if (companyId) {
      setPageTitle("Company Reports");
    } else {
      setPageTitle("All Reports");
    }
  }, [companyId]);

  // If we have a companyId, use the company-specific report API
  const { data: companyReportData, isLoading: isLoadingCompanyReports } =
    api.report.getAllReportsForCompany.useQuery(
      {
        companyId: companyId ?? "",
        searched: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit,
      },
      {
        enabled: userRole === "superAdmin" && !!companyId,
      },
    );

  // If no companyId, use the general report API
  const { data: reportData, isLoading: isLoadingAllReports } =
    api.report.getAllReports.useQuery(
      {
        searched: debouncedSearch,
        sortBy: sortBy,
        page: pagination.page,
        limit: pagination.limit,
      },
      {
        enabled: userRole === "superAdmin" && !companyId,
      },
    );

  // Determine which data to use
  const reports = companyId
    ? (companyReportData?.reports ?? [])
    : (reportData?.data ?? []);

  const total = companyId
    ? (companyReportData?.total ?? 0)
    : (reportData?.total ?? 0);

  const pageLimit = companyId
    ? (companyReportData?.limit ?? pagination.limit)
    : (reportData?.limit ?? pagination.limit);

  const isLoading = companyId ? isLoadingCompanyReports : isLoadingAllReports;

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
      <h1 className="mb-6 text-2xl font-bold">{pageTitle}</h1>

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
        actionButton={<ReportModalButton companyId={companyId ?? undefined} />}
        isLoading={isLoading}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
