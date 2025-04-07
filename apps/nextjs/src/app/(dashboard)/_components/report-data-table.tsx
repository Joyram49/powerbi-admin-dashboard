"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { EyeIcon, MoreHorizontal, PencilIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { Pagination } from "./Pagination";

// Detailed interface for the report
interface Report {
  id: string;
  reportName: string;
  company: string;
  dateCreated: string;
  userCount?: number;
  accessCount?: number;
  status: "active" | "inactive";
  url: string;
}

// Simplified props interface
interface ReportsDataTableProps {
  data: any[]; // API response data
  userRole: string | undefined;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onAddReport: () => void;
  onEditReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onReportClick: (reportId: string) => void;
  onSearch: (query: string) => void;
}

export function ReportsDataTable({
  data,
  userRole,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  isLoading,
  onAddReport,
  onEditReport,
  onDeleteReport,
  onReportClick,
  onSearch,
}: ReportsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Map incoming data to consistent Report structure
  const mappedData: Report[] = data.map((report) => ({
    id: report.id || report.reportId,
    reportName: report.reportName,
    company:
      report.company?.companyName || report.company?.name || "No Company",
    dateCreated: report.dateCreated
      ? new Date(report.dateCreated).toLocaleDateString()
      : "N/A",
    userCount: report.userCounts || report.userCount || 0,
    accessCount: report.accessCount || 0,
    status: report.status || "inactive",
    url: report.reportUrl || report.url || "",
  }));

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Submit search when Enter is pressed
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  // Define columns with type safety
  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "reportName",
      header: "Report Name",
      cell: ({ row }) => (
        <div
          className="cursor-pointer font-medium hover:text-blue-600"
          onClick={() => onReportClick(row.original.id)}
        >
          {row.getValue("reportName")}
        </div>
      ),
    },
    {
      accessorKey: "company",
      header: "Company",
    },
    {
      accessorKey: "dateCreated",
      header: "Created On",
    },
    {
      accessorKey: userRole === "user" ? "accessCount" : "userCount",
      header: userRole === "user" ? "Access Count" : "User Count",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <Badge variant={status === "active" ? "outline" : "secondary"}>
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
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
              <DropdownMenuItem onClick={() => onReportClick(report.id)}>
                <EyeIcon className="mr-2 h-4 w-4" />
                View Report
              </DropdownMenuItem>
              {(userRole === "superAdmin" || userRole === "admin") && (
                <>
                  <DropdownMenuItem onClick={() => onEditReport(report.id)}>
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDeleteReport(report.id)}
                  >
                    <Trash2Icon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Create table instance
  const table = useReactTable({
    data: mappedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      {/* Search and Add Report Controls */}
      <div className="flex justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-64">
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full rounded-md border px-4 py-2 pr-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button
            type="submit"
            className="absolute right-2 top-2.5 text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>

        {(userRole === "superAdmin" || userRole === "admin") && (
          <Button
            onClick={onAddReport}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            Add New Report
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                    No reports found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / pageSize)}
        onPageChange={onPageChange}
      />
    </div>
  );
}
