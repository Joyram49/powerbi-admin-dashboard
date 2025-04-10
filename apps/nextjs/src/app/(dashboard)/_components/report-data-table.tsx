"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Pagination } from "./Pagination";

// Define the shape of a single report
interface ReportColTypes {
  id: string;
  reportId?: string;
  reportName: string;
  reportUrl: string;
  accessCount?: number;
  userCount?: number;
  userCounts?: number;
  company?: {
    id: string;
    companyName?: string;
  };
  dateCreated?: string;
  status?: string;
  lastModifiedAt?: string;
}

// Props for the ReportsDataTable component
interface ReportDataTypes {
  userRole: string;
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
}: ReportDataTypes) {

  const searchParams = useSearchParams();

  // Get pagination parameters from the URL
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  // Default to page 1 and limit 10 if not provided
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const pageSize = limitParam ? parseInt(limitParam) : 10;

  // Fetch reports based on user role
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
        companyId: companyId || "",
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

  // Determine which data to use
  let reportData: ReportColTypes[] = [];
  let totalItems = 0;
  let totalPages = 1;
  let isLoading = false;

  if (companyId) {
    reportData = companyReportsData?.reports || [];
    totalItems = companyReportsData?.total || 0;
    isLoading = isCompanyReportsLoading;
  } else if (userRole === "superAdmin") {
    reportData = superAdminData?.data || [];
    totalItems = superAdminData?.total || 0;
    isLoading = isSuperAdminLoading;
  } else if (userRole === "admin") {
    reportData = adminData?.reports || [];
    totalItems = adminData?.total || 0;
    isLoading = isAdminLoading;
  } else if (userRole === "user") {
    reportData = userData?.reports || [];
    totalItems = userData?.total || 0;
    isLoading = isUserLoading;
  }

  // Calculate total pages
  totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Format data for the table
  const formattedData = reportData.map((report) => {
    // Handle different report formats between endpoints
    const formattedReport: ReportColTypes = {
      id: report.id || report.reportId || "",
      reportName: report.reportName,
      reportUrl: report.reportUrl,
      accessCount: report.accessCount,
      userCount: report.userCount ?? report.userCounts,
      company: report.company,
      dateCreated: report.dateCreated,
      status: report.status,
      lastModifiedAt: report.lastModifiedAt,
    };
    return formattedReport;
  });

  const handleOpenReport = (report: ReportColTypes) => {
    if (userRole === "user") {
      updateReportAccess({
        reportId: report.id,
        accessCount: (report.accessCount || 0) + 1,
      });
    }
    window.open(report.reportUrl, "_blank", "noopener noreferrer");
  };

  const columns: ColumnDef<ReportColTypes>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const id = row.getValue("id");
        return <div className="font-medium">{id}</div>;
      },
    },
    {
      accessorKey: "company.companyName",
      header: "Company Name",
      cell: ({ row }) => {
        const company = row.original.company;
        return <div>{company?.companyName || "N/A"}</div>;
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
            variant={status === "active" ? "default" : "secondary"}
            className="bg-green-500 text-green-900 hover:bg-green-400"
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
    data: formattedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    manualPagination: true,
    pageCount: totalPages,
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", size.toString());
    params.set("page", "1"); // Reset to first page when changing page size
    
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
            {formattedData.length ? (
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
