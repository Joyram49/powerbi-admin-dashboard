"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useState } from "react";

import { api } from "~/trpc/react";
import { DataTable } from "../_components/DataTable";
import { useUserColumns } from "../super-admin/users/_components/UserColumns";
import UserModalButton from "../super-admin/users/_components/UserModal";

interface CompanyUser {
  id: string;
  userName: string;
  email: string;
  role: "user" | "admin" | "superAdmin";
  status: "active" | "inactive" | null;
  dateCreated: Date;
  lastLogin: Date | null;
  companyId: string | null;
  modifiedBy: string | null;
  isSuperAdmin: boolean;
  passwordHistory: string[] | null;
  company: {
    companyName: string;
  } | null;
}

export default function AdminPage() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  // TODO: Add debounce to search input in api endpoint
  // const debouncedSearch = useDebounce(searchInput, 500);
  const [sortBy, setSortBy] = useState<"userName" | "dateCreated">(
    "dateCreated",
  );

  // Get user profile to access company ID
  const { data: profileData } = api.auth.getProfile.useQuery();
  const userId = profileData?.user?.id;
  const { data: companies } = api.company.getCompaniesByAdminId.useQuery({
    companyAdminId: userId ?? "",
  });
  const companyId = companies?.data[0]?.id;

  // Fetch users for the company
  const { data: usersData, isLoading } = api.user.getUsersByCompanyId.useQuery(
    {
      companyId: companyId ?? "",
      limit: pagination.limit,
      page: pagination.page,
    },
    {
      enabled: !!companyId,
    },
  );

  const columns = useUserColumns() as ColumnDef<CompanyUser, unknown>[];

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback(
    (newSortBy: "userName" | "dateCreated") => {
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

  const transformedUsers =
    usersData?.users.map((user) => ({
      ...user,
      isSuperAdmin: user.role === "superAdmin",
      passwordHistory: [],
    })) ?? [];

  return (
    <div className="container mx-auto w-full p-6">
      <DataTable<CompanyUser, unknown, "userName" | "dateCreated">
        columns={columns}
        data={transformedUsers}
        pagination={{
          pageCount:
            usersData?.total && usersData.limit
              ? Math.ceil(usersData.total / usersData.limit)
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
        isLoading={isLoading}
        placeholder="Search by user email..."
        actionButton={<UserModalButton />}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
