"use client";

import { useCallback, useState } from "react";


import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../_components/DataTable";
import { useUserColumns } from "../super-admin/users/_components/UserColumns";
import UserModalButton from "../super-admin/users/_components/UserModal";

interface CompanyUser {
  id: string;
  userName: string;
  email: string;
  role: "user" | "admin";
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
  const debouncedSearch = useDebounce(searchInput, 500);
  const [sortBy, setSortBy] = useState<"userName" | "dateCreated">(
    "dateCreated",
  );

  // Get user profile to access company ID
  const { data: profileData } = api.auth.getProfile.useQuery();
  const companyId = profileData?.user?.user_metadata.companyId as string;

  // Fetch users for the company
  const { data: usersData, isLoading } = api.user.getUsersByCompanyId.useQuery(
    {
      companyId,
      limit: pagination.limit,
      page: pagination.page,
    },
    {
      enabled: !!companyId,
    },
  );

  const columns = useUserColumns();

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

  return (
    <div className="container mx-auto w-full p-6">
      <DataTable<CompanyUser, unknown, "userName" | "dateCreated">
        columns={columns}
        data={usersData?.users ?? []}
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
