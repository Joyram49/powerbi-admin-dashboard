"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@acme/ui/button";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DataTable } from "../../_components/DataTable";
import { DataTableSkeleton } from "../../_components/DataTableSkeleton";
import useUserColumns from "./_components/UserColumns";
import UserModal from "./_components/UserModal";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");
  const reportId = searchParams.get("reportId");
  const userType = searchParams.get("userType") as
    | "all"
    | "admin"
    | "general"
    | null;

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500); // 500ms delay
  const [sortBy, setSortBy] = useState<"userName" | "dateCreated">(
    "dateCreated",
  );
  const [userTypeState, setUserTypeState] = useState<
    "all" | "admin" | "general"
  >(userType ?? "all");
  const columns = useUserColumns();
  const { data: profileData } = api.auth.getProfile.useQuery();
  const userRole = profileData?.user?.user_metadata.role as string;

  const [pageTitle, setPageTitle] = useState("All Users");

  // Set page title based on if we're filtering by company or report
  useEffect(() => {
    if (reportId) {
      setPageTitle("Report Users");
    } else if (companyId) {
      if (userType === "admin") {
        setPageTitle("Company Admins");
      } else {
        setPageTitle("Company Users");
      }
      setUserTypeState(userType ?? "general");
    } else {
      setPageTitle("All Users");
    }
  }, [companyId, reportId, userType]);

  // If we have a reportId, fetch report users
  const { data: reportUsersData, isLoading: isLoadingReportUsers } =
    api.user.getUsersByReportId.useQuery(
      { reportId: reportId ?? "" },
      { enabled: !!reportId },
    );

  // Determine which queries should be enabled based on user role and filters
  const isSuperAdmin = userRole === "superAdmin";
  const isAdmin = userRole === "admin";

  // Set defaults based on role
  useEffect(() => {
    if (isAdmin) {
      setUserTypeState("admin");
    }
  }, [isAdmin]);

  // Use getAdminsByCompanyId when companyId is present and userType is admin
  const { data: companyAdminsData, isLoading: isLoadingCompanyAdmins } =
    api.user.getAdminsByCompanyId.useQuery(
      {
        companyId: companyId ?? "",
      },
      {
        enabled: !!companyId && userType === "admin" && !reportId,
      },
    );

  // Use getUsersByCompanyId when companyId is present and userType is not admin
  const { data: companyUsersData, isLoading: isLoadingCompanyUsers } =
    api.user.getUsersByCompanyId.useQuery(
      {
        companyId: companyId ?? "",
        page: pagination.page,
        limit: pagination.limit,
        searched: debouncedSearch,
      },
      {
        enabled: !!companyId && userType !== "admin" && !reportId,
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
        enabled:
          isSuperAdmin && userTypeState === "all" && !companyId && !reportId,
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
          (isSuperAdmin || isAdmin) &&
          userTypeState === "admin" &&
          !companyId &&
          !reportId,
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
          (isSuperAdmin || isAdmin) &&
          userTypeState === "general" &&
          !companyId &&
          !reportId,
      },
    );

  // Determine which data to use
  const userData = (() => {
    if (reportId && reportUsersData?.data) {
      return reportUsersData.data;
    } else if (companyId && userType === "admin" && companyAdminsData?.data) {
      // Transform admin data to match User type
      return companyAdminsData.data.map((admin) => ({
        ...admin,
        company: null, // Add missing company field
      }));
    } else if (companyId && companyUsersData) {
      return companyUsersData.users;
    } else if (userTypeState === "all" && allUsersData) {
      return allUsersData.data;
    } else if (userTypeState === "admin" && adminUsersData) {
      return adminUsersData.data;
    } else if (userTypeState === "general" && generalUsersData) {
      return generalUsersData.data;
    }
    return [];
  })();

  const totalItems = (() => {
    if (reportId && reportUsersData?.data) {
      return reportUsersData.data.length;
    } else if (companyId && userType === "admin" && companyAdminsData?.data) {
      return companyAdminsData.data.length;
    } else if (companyId && companyUsersData) {
      return companyUsersData.total;
    } else if (userTypeState === "all" && allUsersData) {
      return allUsersData.total;
    } else if (userTypeState === "admin" && adminUsersData) {
      return adminUsersData.total;
    } else if (userTypeState === "general" && generalUsersData) {
      return generalUsersData.total;
    }
    return 0;
  })();

  const pageLimit = (() => {
    if (reportId) {
      return pagination.limit;
    } else if (companyId && userType === "admin") {
      return companyAdminsData?.data.length ?? pagination.limit;
    } else if (companyId && companyUsersData) {
      return companyUsersData.limit;
    } else if (userTypeState === "all" && allUsersData) {
      return allUsersData.limit;
    } else if (userTypeState === "admin" && adminUsersData) {
      return adminUsersData.limit;
    } else if (userTypeState === "general" && generalUsersData) {
      return generalUsersData.limit;
    }
    return pagination.limit;
  })();

  const isLoading =
    isLoadingAllUsers ||
    isLoadingAdminUsers ||
    isLoadingGeneralUsers ||
    isLoadingCompanyUsers ||
    isLoadingCompanyAdmins ||
    isLoadingReportUsers;

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
    <div className="container mx-auto w-full max-w-[98%] p-6">
      <h1 className="mb-6 text-2xl font-bold">{pageTitle}</h1>

      {/* User type selector - hide if filtering by company or report */}
      {!companyId && !reportId && (
        <div className="mb-4 flex gap-2">
          <Button
            onClick={() => setUserTypeState("all")}
            className={`rounded px-4 py-2 ${
              userTypeState === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            All Users
          </Button>
          <Button
            onClick={() => setUserTypeState("admin")}
            className={`rounded px-4 py-2 ${
              userTypeState === "admin"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            Admin Users
          </Button>
          <Button
            onClick={() => setUserTypeState("general")}
            className={`rounded px-4 py-2 ${
              userTypeState === "general"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            General Users
          </Button>
        </div>
      )}

      {isLoading ? (
        <DataTableSkeleton
          columnCount={columns.length}
          rowCount={pagination.limit}
          searchable={true}
          filterable={true}
          actionButton={!reportId}
        />
      ) : (
        <DataTable<User, unknown, "userName" | "dateCreated">
          columns={columns}
          data={userData}
          pagination={{
            pageCount:
              totalItems && pageLimit ? Math.ceil(totalItems / pageLimit) : 0,
            page: pagination.page,
            onPageChange: (page) =>
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
          actionButton={
            !reportId && <UserModal companyId={companyId ?? undefined} />
          }
          pageSize={pagination.limit}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      )}
    </div>
  );
}
