"use client";

import { useCallback, useState } from "react";

import type { Company } from "~/types/company"; // Make sure to import the Company type
import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../_components/DataTable";
import { useCompanyColumns } from "./_components/CompanyColumns";
import CompanyModalButton from "./_components/CompanyModal";

export default function SuperDashboard() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay
  const [sortBy, setSortBy] = useState<"companyName" | "dateJoined">();
  const columns = useCompanyColumns();

  const { data: companyData, isLoading } = api.company.getAllCompanies.useQuery(
    {
      searched: debouncedSearch,
      sortBy: sortBy,
      page: pagination.page,
      limit: pagination.limit,
    },
  );
  // Extract actual company data array from the response
  const companies = companyData?.data ?? [];

  const { data: activeCompanies } = api.company.getCompaniesByAdminId.useQuery({
    companyAdminId: "56865c5d-b69c-4abf-bf5a-d6abd9c30a99",
    searched: debouncedSearch,
    sortBy: sortBy,
    page: pagination.page,
    limit: pagination.limit,
  });

  console.log(activeCompanies);

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
    <div className="container mx-auto w-full max-w-[98%] p-6">
      <DataTable<Company, unknown, "companyName" | "dateJoined">
        columns={columns}
        data={companies}
        pagination={{
          pageCount:
            companyData?.total && companyData.limit
              ? Math.ceil(companyData.total / companyData.limit)
              : 0,
          page: pagination.page,
          onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
          onPageSizeChange: handlePageSizeChange, // Add page size change handler
        }}
        sorting={{
          sortBy,
          onSortChange: (newSortBy) => setSortBy(newSortBy),
          sortOptions: ["companyName", "dateJoined"],
        }}
        search={{
          value: searchInput,
          onChange: handleSearchChange,
        }}
        placeholder="Search companies..."
        actionButton={<CompanyModalButton />}
        isLoading={isLoading}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
