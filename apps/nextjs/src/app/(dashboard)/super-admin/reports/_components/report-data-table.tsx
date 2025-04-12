"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Edit, ExternalLink, MoreHorizontal, Trash } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Skeleton } from "@acme/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { api } from "~/trpc/react";
import { Pagination } from "../../../_components/Pagination";

// Define user roles type
type UserRole = "superAdmin" | "admin" | "user";

// Define the shape of a single report based on API response
interface ReportColTypes {
  id: string;
  reportId?: string;
  reportName: string;
  reportUrl: string;
  accessCount: number | null;
  userCount?: number;
  userCounts?: number; // Added to support the superAdmin API response
  company: {
    id: string;
    companyName: string;
  } | null;
  dateCreated: Date | null;
  status: "active" | "inactive" | null;
  lastModifiedAt: Date | null;
}

// Props for the ReportsDataTable component
interface ReportDataProps {
  userRole: UserRole;
  onEdit: (report: ReportColTypes) => void;
  onDelete: (report: ReportColTypes) => void;
  searchQuery?: string;
  companyId?: string;
}

export function ReportsDataTable({
  userRole,
  onEdit,
  onDelete,
  searchQuery = "",
  companyId,
}: ReportDataProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Calculate values for pagination
  const currentPage = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;

  // Fetch reports based on user role and conditions
  const { data: superAdminData, isLoading: isSuperAdminLoading } =
    api.report.getAllReports.useQuery(
      {
        searched: searchQuery,
        page: currentPage,
        limit: pageSize,
      },
      {
        enabled: userRole === "superAdmin" && !companyId,
      },
    );

  const { data: adminData, isLoading: isAdminLoading } =
    api.report.getAllReportsAdmin.useQuery(
      {
        searched: searchQuery,
        page: currentPage,
        limit: pageSize,
      },
      {
        enabled: userRole === "admin" && !companyId,
      },
    );

  const { data: userData, isLoading: isUserLoading } =
    api.report.getAllReportsUser.useQuery(
      {
        searched: searchQuery,
        page: currentPage,
        limit: pageSize,
      },
      {
        enabled: userRole === "user" && !companyId,
      },
    );

  const { data: companyReportsData, isLoading: isCompanyReportsLoading } =
    api.report.getAllReportsForCompany.useQuery(
      {
        companyId: companyId ?? "",
        searched: searchQuery,
        page: currentPage,
        limit: pageSize,
      },
      {
        enabled: !!companyId,
      },
    );

  // Update report access count
  const { mutate: updateReportAccess } = api.report.updateReport.useMutation();

  // Determine which data to use based on the API response structure
  let reportData: ReportColTypes[] = [];
  let totalItems = 0;
  let isLoading = false;

  if (companyId) {
    reportData = companyReportsData?.reports ?? [];
    totalItems = companyReportsData?.total ?? 0;
    isLoading = isCompanyReportsLoading;
  } else if (userRole === "superAdmin") {
    // Normalize data structure from superAdmin API response
    reportData =
      superAdminData?.data.map((item) => ({
        ...item,
        userCount: item.userCounts, // Map userCounts to userCount for consistency
      })) ?? [];
    totalItems = superAdminData?.total ?? 0;
    isLoading = isSuperAdminLoading;
  } else if (userRole === "admin") {
    reportData = adminData?.reports ?? [];
    totalItems = adminData?.total ?? 0;
    isLoading = isAdminLoading;
  } else {
    // For user role, we need to normalize the data structure
    reportData =
      userData?.reports.map((report) => ({
        ...report,
        id: report.reportId, // Handle different id field
      })) ?? [];
    totalItems = userData?.total ?? 0;
    isLoading = isUserLoading;
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const handleOpenReport = (report: ReportColTypes) => {
    const reportId = report.reportId ?? report.id;

    if (userRole === "user") {
      updateReportAccess({
        reportId,
        accessCount: (report.accessCount ?? 0) + 1,
      });
    }
    window.open(report.reportUrl, "_blank", "noopener noreferrer");
  };

  const columns: ColumnDef<ReportColTypes>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        // Use reportId if it exists (from user data), otherwise use id
        const id = row.original.reportId ?? row.getValue("id");
        return <div className="font-medium">{id}</div>;
      },
    },
    {
      accessorKey: "company.companyName",
      header: "Company Name",
      cell: ({ row }) => {
        const company = row.original.company;
        return <div>{company?.companyName ?? "N/A"}</div>;
      },
    },
    {
      accessorKey: "reportName",
      header: "Report Name",
    },
    {
      id: "reportLink",
      header: "Report",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenReport(row.original)}
          title="Open Report"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "userCount",
      header: "# Users",
      cell: ({ row }) => {
        // Handle both userCount and userCounts field
        const count = row.original.userCount ?? row.original.userCounts ?? 0;
        return <div className="text-center">{count}</div>;
      },
    },
    {
      accessorKey: "dateCreated",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.getValue("dateCreated");
        return (
          <div>
            {date ? format(new Date(date.toString()), "MMM dd, yyyy") : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <Badge
            variant={status === "active" ? "default" : "destructive"}
            className={
              status === "active"
                ? "bg-green-500 text-green-900 hover:bg-green-400"
                : ""
            }
          >
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lastModifiedAt",
      header: "Last Accessed",
      cell: ({ row }) => {
        const date = row.getValue("lastModifiedAt");
        return (
          <div>
            {date
              ? format(new Date(date.toString()), "MMM dd, yyyy HH:mm")
              : "N/A"}
          </div>
        );
      },
    },
  ];

  // Add actions column for superAdmin role
  if (userRole === "superAdmin") {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const report = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(report)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(report)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  const table = useReactTable({
    data: reportData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: totalPages,
  });

  // Define pagination handlers for the Pagination component
  const handlePageChange = (newPage: number) => {
    setPagination({
      ...pagination,
      pageIndex: newPage - 1, // Convert from 1-indexed to 0-indexed
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({
      pageIndex: 0, // Reset to first page when changing page size
      pageSize: newPageSize,
    });
  };

  if (isLoading) {
    return <TableSkeleton columns={columns.length} />;
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {reportData.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showPageSizeSelector={true}
        />
      </div>
    </div>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-6 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: columns }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
