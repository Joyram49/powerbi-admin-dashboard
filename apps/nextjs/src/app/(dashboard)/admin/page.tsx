"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { CompanyUser } from "@acme/db/schema";

import { api } from "~/trpc/react";
import { DataTable } from "../_components/DataTable";
import { DataTableSkeleton } from "../_components/DataTableSkeleton";
import UserModal from "../super-admin/users/_components/UserModal";
import { useUserColumns } from "./_components/AdminUserColumns";
import CompanySelector from "./_components/CompanySelector";

// Types
type SortField = "userName" | "dateCreated";
interface PaginationState {
  page: number;
  limit: number;
}

export default function AdminPage() {
  // URL and state management
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("dateCreated");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");

  // Data fetching hooks
  const { data: profileData, isLoading: isLoadingProfile } =
    api.auth.getProfile.useQuery();
  const userId = profileData?.user?.id;

  const { data: companiesData, isLoading: isLoadingCompanies } =
    api.company.getCompaniesByAdminId.useQuery(
      { companyAdminId: userId ?? "" },
      { enabled: !!userId },
    );

  const { data: usersData, isLoading: isLoadingUsers } =
    api.user.getUsersByAdminId.useQuery(
      {
        status: undefined,
        searched: searchInput,
        limit: pagination.limit,
        page: pagination.page,
        sortBy,
      },
      { enabled: !!userId && selectedCompanyId === "all" },
    );

  const { data: companyUsersData, isLoading: isLoadingCompanyUsers } =
    api.user.getUsersByCompanyId.useQuery(
      {
        companyId: selectedCompanyId,
        searched: searchInput,
        limit: pagination.limit,
        page: pagination.page,
      },
      { enabled: !!selectedCompanyId && selectedCompanyId !== "all" },
    );

  const { data: reportUsersData, isLoading: isLoadingReportUsers } =
    api.user.getUsersByReportId.useQuery(
      { reportId: reportId ?? "" },
      { enabled: !!reportId },
    );

  // UI components and handlers
  const { columns, modals } = useUserColumns();

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback((newSortBy: SortField) => {
    setSortBy(newSortBy);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination(() => ({
      limit: newPageSize,
      page: 1,
    }));
  }, []);

  // Data transformation
  const transformedUsers = (() => {
    if (reportId && reportUsersData?.data) {
      return reportUsersData.data.map((user) => ({
        ...user,
        isSuperAdmin: user.role === "superAdmin",
        passwordHistory: [],
      }));
    }
    return (
      selectedCompanyId === "all"
        ? (usersData?.data ?? [])
        : (companyUsersData?.users ?? [])
    ).map((user) => ({
      ...user,
      isSuperAdmin: user.role === "superAdmin",
      passwordHistory: [],
    }));
  })();

  const totalUsers = (() => {
    if (reportId && reportUsersData?.data) {
      return reportUsersData.data.length;
    }
    return selectedCompanyId === "all"
      ? (usersData?.total ?? 0)
      : (companyUsersData?.total ?? 0);
  })();

  // Loading state
  const isLoading =
    isLoadingProfile ||
    isLoadingCompanies ||
    isLoadingUsers ||
    isLoadingCompanyUsers ||
    isLoadingReportUsers;

  return (
    <div className="container mx-auto w-full max-w-[100%] p-6">
      {!reportId && (
        <CompanySelector
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
          companies={companiesData?.data ?? []}
          isLoading={isLoadingProfile || isLoadingCompanies}
        />
      )}

      {isLoading ? (
        <DataTableSkeleton
          columnCount={columns.length}
          rowCount={pagination.limit}
          searchable={true}
          filterable={true}
          actionButton={true}
        />
      ) : (
        <DataTable<CompanyUser, unknown, SortField>
          tableId="admin-users"
          columns={columns}
          data={transformedUsers}
          pagination={{
            pageCount:
              totalUsers && pagination.limit
                ? Math.ceil(totalUsers / pagination.limit)
                : 0,
            page: pagination.page,
            onPageChange: (page: number) =>
              setPagination((prev) => ({ ...prev, page })),
            onPageSizeChange: handlePageSizeChange,
          }}
          sorting={{
            sortBy,
            onSortChange: handleSortChange,
            sortOptions: ["userName", "dateCreated"],
          }}
          search={{
            value: searchInput,
            onChange: handleSearchChange,
          }}
          placeholder="Search by user email..."
          actionButton={!reportId && <UserModal />}
          pageSize={pagination.limit}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      )}
      {modals}
    </div>
  );
}
