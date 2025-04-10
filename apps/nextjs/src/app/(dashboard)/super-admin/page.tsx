"use client";

import { useCallback, useState } from "react";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { columns } from "./_components/company-columns";
import { DataTable } from "./_components/company-data-table";

export default function SuperDashboard() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay
  const [sortBy, setSortBy] = useState<"companyName" | "dateJoined">();

  const { data: companyData, isLoading } = api.company.getAllCompanies.useQuery(
    {
      searched: debouncedSearch,
      sortBy: sortBy,
      page: pagination.page,
      limit: pagination.limit,
    },
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
  }, []);

  return (
    <div className="container mx-auto w-full p-6">
      <DataTable
        columns={columns}
        data={companyData?.data}
        pagination={{
          pageCount: companyData
            ? Math.ceil(companyData.total / companyData.limit)
            : 0,
          page: pagination.page,
          onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
        }}
        sorting={{
          sortBy,
          onSortChange: (newSortBy) => setSortBy(newSortBy),
        }}
        search={{
          value: searchInput,
          onChange: handleSearchChange,
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
