"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";

import type { CompanyUser } from "@acme/db/schema";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { api } from "~/trpc/react";
import { DataTable } from "../_components/DataTable";
import UserModal from "../super-admin/users/_components/UserModal";
import { useUserColumns } from "./_components/AdminUserColumns";

export default function AdminPage() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<"userName" | "dateCreated">(
    "dateCreated",
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");

  // Get user profile to access company ID
  const { data: profileData } = api.auth.getProfile.useQuery();
  const userId = profileData?.user?.id;

  // Fetch companies for the admin
  const { data: companiesData } = api.company.getCompaniesByAdminId.useQuery(
    {
      companyAdminId: userId ?? "",
    },
    {
      enabled: !!userId,
    },
  );

  // Fetch users based on selection
  const { data: usersData, isLoading } = api.user.getUsersByAdminId.useQuery(
    {
      status: undefined,
      searched: searchInput,
      limit: pagination.limit,
      page: pagination.page,
      sortBy,
    },
    {
      enabled: !!userId && selectedCompanyId === "all",
    },
  );

  // Fetch users for the selected company
  const { data: companyUsersData, isLoading: isLoadingCompanyUsers } =
    api.user.getUsersByCompanyId.useQuery(
      {
        companyId: selectedCompanyId,
        searched: searchInput,
        limit: pagination.limit,
        page: pagination.page,
      },
      {
        enabled: !!selectedCompanyId && selectedCompanyId !== "all",
      },
    );

  const { columns, modals } = useUserColumns();

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

  const transformedUsers = (
    selectedCompanyId === "all"
      ? (usersData?.data ?? [])
      : (companyUsersData?.users ?? [])
  ).map((user) => ({
    ...user,
    isSuperAdmin: user.role === "superAdmin",
    passwordHistory: [],
  }));

  const totalUsers =
    selectedCompanyId === "all"
      ? (usersData?.total ?? 0)
      : (companyUsersData?.total ?? 0);

  return (
    <div className="container mx-auto w-full max-w-[98%] p-6">
      <div className="z-10 mb-4">
        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
          <SelectTrigger className="w-[250px] border-slate-200 dark:border-slate-800">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <SelectItem
              value="all"
              className="mb-2 cursor-pointer hover:bg-slate-100 data-[state=checked]:bg-slate-600 dark:hover:bg-slate-700 dark:data-[state=checked]:bg-slate-600"
            >
              All Users
            </SelectItem>
            {companiesData?.data.map((company) => (
              <SelectItem
                key={company.id}
                value={company.id}
                className="cursor-pointer hover:bg-slate-100 data-[state=checked]:bg-slate-600 dark:hover:bg-slate-700 dark:data-[state=checked]:bg-slate-600"
              >
                {company.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable<CompanyUser, unknown, "userName" | "dateCreated">
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
        isLoading={
          selectedCompanyId === "all" ? isLoading : isLoadingCompanyUsers
        }
        placeholder="Search by user email..."
        actionButton={<UserModal />}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />

      {/* Render modals */}
      {modals}
    </div>
  );
}
