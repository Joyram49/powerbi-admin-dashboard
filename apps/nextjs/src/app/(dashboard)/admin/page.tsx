"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";

import type { CompanyUser } from "@acme/db/schema";

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
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const handleUserEdit = (event: CustomEvent<{ userId: string }>) => {
      setSelectedUserId(event.detail.userId);
      setIsEditModalOpen(true);
    };

    window.addEventListener("user-edit", handleUserEdit as EventListener);
    return () =>
      window.removeEventListener("user-edit", handleUserEdit as EventListener);
  }, []);

  const { data: companyList, isSuccess } =
    api.user.getUsersByAdminId.useQuery();

  if (isSuccess) {
    console.log(">>> company list", companyList);
  }

  // Get user profile to access company ID
  const { data: profileData } = api.auth.getProfile.useQuery();
  const userId = profileData?.user?.id;

  // Fetch users for the company
  const { data: usersData, isLoading } = api.user.getUsersByAdminId.useQuery(
    {
      status: undefined,
      searched: searchInput,
      limit: pagination.limit,
      page: pagination.page,
      sortBy,
    },
    {
      enabled: !!userId,
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

  const transformedUsers = (usersData?.data ?? []).map((user) => ({
    ...user,
    isSuperAdmin: user.role === "superAdmin",
    passwordHistory: [],
  }));

  return (
    <div className="container mx-auto w-full max-w-[98%] p-6">
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
        actionButton={<UserModal />}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />

      {/* Single Edit Modal Instance */}
      {selectedUserId && (
        <UserModal
          userId={selectedUserId}
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
          type="edit"
          triggerButton={false}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUserId(undefined);
          }}
        />
      )}
    </div>
  );
}
