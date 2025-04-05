"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { api } from "~/trpc/react";
import { ReportsDataTable } from "./_components/report-data-table";
import ReportsPageSkeleton from "./_components/report-skeleton";

export default function ReportsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Get user role
  const { data: userInfo, isLoading: isUserLoading } =
    api.auth.getProfile.useQuery();
  const userRole = userInfo?.user.user_metadata.role as string;

  // Always call all the query hooks, but only use the data from the relevant one
  const { data: superAdminData, isLoading: isSuperAdminLoading } =
    api.report.getAllReports.useQuery(
      { searched: searchQuery, page, limit },
      { enabled: userRole === "superAdmin" }, // Only fetch if user is superAdmin
    );
  console.log(superAdminData);
  const { data: adminData, isLoading: isAdminLoading } =
    api.report.getAllReportsAdmin.useQuery(
      { searched: searchQuery, page, limit },
      { enabled: userRole === "admin" }, // Only fetch if user is admin
    );

  const { data: userData, isLoading: isUserDataLoading } =
    api.report.getAllReportsUser.useQuery(
      { searched: searchQuery, page, limit },
      { enabled: userRole === "user" }, // Only fetch if user is regular user
    );

  // Determine which data to use based on role
  const data =
    userRole === "superAdmin"
      ? superAdminData
      : userRole === "admin"
        ? adminData
        : userRole === "user"
          ? userData
          : null;

  // Combined loading state
  const isLoading =
    isUserLoading ||
    (userRole === "superAdmin" && isSuperAdminLoading) ||
    (userRole === "admin" && isAdminLoading) ||
    (userRole === "user" && isUserDataLoading);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (value: string) => {
    setLimit(parseInt(value, 10));
    setPage(1); // Reset to first page when changing limit
  };

  if (isLoading) {
    return <ReportsPageSkeleton />;
  }

  // Format data for the table based on the user role
  const tableData = (() => {
    if (!data) return [];

    if (userRole === "superAdmin" && superAdminData) {
      return superAdminData.data.map((item) => ({
        id: item.id,
        reportName: item.reportName,
        company: item.company.companyName,
        dateCreated: new Date(item.dateCreated).toLocaleDateString(),
        userCount: item.userCounts,
        status: item.status,
        url: item.reportUrl,
      }));
    } else if (userRole === "admin" && adminData) {
      return adminData.reports.map((item) => ({
        id: item.id,
        reportName: item.reportName,
        company: item.company.companyName,
        dateCreated: new Date(item.dateCreated).toLocaleDateString(),
        userCount: item.userCounts,
        status: item.status,
        url: item.reportUrl,
      }));
    } else if (userRole === "user" && userData) {
      return userData.reports.map((item) => ({
        id: item.reportId,
        reportName: item.reportName,
        company: item.company.companyName,
        dateCreated: new Date(item.dateCreated).toLocaleDateString(),
        accessCount: item.accessCount,
        status: item.status,
        url: item.reportUrl,
      }));
    }

    return [];
  })();

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        {userRole === "superAdmin" && (
          <Button
            className="bg-blue-500 text-white hover:to-blue-600"
            onClick={() => router.push("/reports/add")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Report
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Show</span>
          <Select value={limit.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
      </div>

      <ReportsDataTable
        data={tableData}
        userRole={userRole}
        currentPage={page}
        pageSize={limit}
        totalItems={data?.total ?? 0}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
