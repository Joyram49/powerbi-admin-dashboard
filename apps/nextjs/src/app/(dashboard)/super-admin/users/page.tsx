"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../../_components/DataTable";
import { useUserColumns } from "./_components/UserColumns";
import UserModalButton from "./_components/UserModal"; // Import your user modal button

export default function UsersPage() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");

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

  const [pageTitle, setPageTitle] = useState("All Users");

  // Set page title based on if we're filtering by company
  useEffect(() => {
    if (companyId) {
      setPageTitle("Company Users");
      // If we have a company filter, we likely want to see general users
      setUserType("general");
    } else {
      setPageTitle("All Users");
    }
  }, [companyId]);

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

  // Use getUsersByCompanyId when companyId is present
  const { data: companyUsersData, isLoading: isLoadingCompanyUsers } =
    api.user.getUsersByCompanyId.useQuery(
      {
        companyId: companyId || "",
        page: pagination.page,
        limit: pagination.limit,
      },
      {
        enabled: !!companyId,
      },
    );

  // For superAdmin, fetch all users when userType is "all" and no companyId
  const { data: allUsersData, isLoading: isLoadingAllUsers } =
    api.user.getAllUsers.useQuery(
      {
        page: pagination.page,
        limit: pagination.limit,
        searched: debouncedSearch,
        sortBy,
      },
      {
        enabled: isSuperAdmin && userType === "all" && !companyId,
      },
    );

  // Fetch admin users when userType is "admin" and no companyId
  const { data: adminUsersData, isLoading: isLoadingAdminUsers } =
    api.user.getAdminUsers.useQuery(
      {
        page: pagination.page,
        limit: pagination.limit,
        searched: debouncedSearch,
        sortBy,
      },
      {
        enabled:
          (isSuperAdmin || isAdmin) && userType === "admin" && !companyId,
      },
    );

  // Fetch general users when userType is "general" and no companyId
  const { data: generalUsersData, isLoading: isLoadingGeneralUsers } =
    api.user.getAllGeneralUser.useQuery(
      {
        page: pagination.page,
        limit: pagination.limit,
        searched: debouncedSearch,
        sortBy,
      },
      {
        enabled:
          (isSuperAdmin || isAdmin) && userType === "general" && !companyId,
      },
    );

  // Determine which data to use
  const userData = (() => {
    if (companyId && companyUsersData) {
      return companyUsersData.users;
    } else if (userType === "all" && allUsersData) {
      return allUsersData.data;
    } else if (userType === "admin" && adminUsersData) {
      return adminUsersData.data;
    } else if (userType === "general" && generalUsersData) {
      return generalUsersData.data;
    }
    return [];
  })();

  const totalItems = (() => {
    if (companyId && companyUsersData) {
      return companyUsersData.total;
    } else if (userType === "all" && allUsersData) {
      return allUsersData.total;
    } else if (userType === "admin" && adminUsersData) {
      return adminUsersData.total;
    } else if (userType === "general" && generalUsersData) {
      return generalUsersData.total;
    }
    return 0;
  })();

  const pageLimit = (() => {
    if (companyId && companyUsersData) {
      return companyUsersData.limit;
    } else if (userType === "all" && allUsersData) {
      return allUsersData.limit;
    } else if (userType === "admin" && adminUsersData) {
      return adminUsersData.limit;
    } else if (userType === "general" && generalUsersData) {
      return generalUsersData.limit;
    }
    return pagination.limit;
  })();

  const isLoading =
    isLoadingAllUsers ||
    isLoadingAdminUsers ||
    isLoadingGeneralUsers ||
    isLoadingCompanyUsers;

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
      <h1 className="mb-6 text-2xl font-bold">{pageTitle}</h1>

      {/* User type selector - hide if filtering by company */}
      {!companyId && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setUserType("all")}
            className={`rounded px-4 py-2 ${
              userType === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setUserType("admin")}
            className={`rounded px-4 py-2 ${
              userType === "admin"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            Admin Users
          </button>
          <button
            onClick={() => setUserType("general")}
            className={`rounded px-4 py-2 ${
              userType === "general"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            General Users
          </button>
        </div>
      )}

      <DataTable<User, unknown, "userName" | "dateCreated">
        columns={columns}
        data={userData}
        pagination={{
          pageCount:
            totalItems && pageLimit ? Math.ceil(totalItems / pageLimit) : 0,
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
        actionButton={<UserModalButton companyId={companyId || undefined} />}
        pageSize={pagination.limit}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
