"use client";

import { useCallback, useState } from "react";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../../_components/DataTable";
import { useUserColumns } from "./_components/UserColumns";
import UserModalButton from "./_components/UserModal"; // Import your user modal button

export default function UsersPage() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay
  const [sortBy, setSortBy] = useState<"userName" | "dateCreated">(
    "dateCreated",
  );
  const [userType, setUserType] = useState<"all" | "admin" | "general">("all");
  const columns = useUserColumns();
  const { data: profileData } = api.auth.getProfile.useQuery();
  const userRole = profileData?.user?.user_metadata.role as string;

  // Determine which queries should be enabled based on user role
  const isSuperAdmin = userRole === "superAdmin";
  const isAdmin = userRole === "admin";

  // Set defaults based on role
  useState(() => {
    if (isAdmin) {
      // If admin, default to admin users
      setUserType("admin");
    }
  });

  // For superAdmin, fetch all users when userType is "all"
  const { data: allUsersData, isLoading: isLoadingAllUsers } =
    api.user.getAllUsers.useQuery(
      {
        page: pagination.page,
        limit: pagination.limit,
        searched: debouncedSearch,
        sortBy,
      },
      {
        enabled: isSuperAdmin && userType === "all",
      },
    );

  // Fetch admin users for both superAdmin and admin roles when userType is "admin"
  const { data: adminUsersData, isLoading: isLoadingAdminUsers } =
    api.user.getAdminUsers.useQuery(
      {
        page: pagination.page,
        limit: pagination.limit,
        searched: debouncedSearch,
        sortBy,
      },
      {
        enabled: (isSuperAdmin || isAdmin) && userType === "admin",
      },
    );

  // Fetch general users when userType is "general"
  const { data: generalUsersData, isLoading: isLoadingGeneralUsers } =
    api.user.getAllGeneralUser.useQuery(
      {
        page: pagination.page,
        limit: pagination.limit,
        searched: debouncedSearch,
        sortBy,
      },
      {
        enabled: (isSuperAdmin || isAdmin) && userType === "general",
      },
    );

  // Determine which data to use based on user role and selected user type
  const currentData = (() => {
    if (isSuperAdmin) {
      // SuperAdmin can see all types
      return userType === "all"
        ? allUsersData
        : userType === "admin"
          ? adminUsersData
          : generalUsersData;
    } else if (isAdmin) {
      // Admin can only see admin and general users
      return userType === "admin" ? adminUsersData : generalUsersData;
    }
    return null;
  })();
  const userData = currentData?.data;
  const isLoading =
    isLoadingAllUsers || isLoadingAdminUsers || isLoadingGeneralUsers;

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
  }, []);

  const handleSortChange = useCallback(
    (newSortBy: "userName" | "dateCreated") => {
      setSortBy(newSortBy);
    },
    [],
  );

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination(() => ({
      limit: newPageSize,
      page: 1, // Reset to first page when changing page size
    }));
  }, []);

  return (
    <div className="container mx-auto w-full p-6">
      {/* User type selector buttons could go here if needed */}

      <DataTable<User, unknown, "userName" | "dateCreated">
        columns={columns}
        data={userData ?? []}
        pagination={{
          pageCount:
            currentData?.total && currentData.limit
              ? Math.ceil(currentData.total / currentData.limit)
              : 0,
          page: pagination.page,
          onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
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
