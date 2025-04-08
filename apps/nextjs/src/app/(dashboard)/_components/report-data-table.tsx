"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
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

// Define the shape of a single report
interface ReportColTypes {
  id: string;
  reportName: string;
  reportUrl: string;
  accessCount?: number;
  userCount?: number;
  userCounts?: number;
  company?: {
    companyName?: string;
  };
  dateCreated?: string;
  status?: string;
  lastModifiedAt?: string;
}

// Props for the ReportsDataTable component
interface ReportDataTypes {
  data: ReportColTypes[];
  isLoading: boolean;
  userRole: string;
  onEdit: (report: ReportColTypes) => void;
  onDelete: (report: ReportColTypes) => void;
  totalItems: number;
  pageCount: number;
  currentPage: number;
}

export function ReportsDataTable({
  data,
  isLoading,
  userRole,
  onEdit,
  onDelete,
  totalItems,
  pageCount,
  currentPage,
}: ReportDataTypes) {
  const router = useRouter();
  const { mutate: updateReportAccess } = api.report.updateReport.useMutation();

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
          <div>{date ? format(new Date(date), "MMM dd, yyyy") : "N/A"}</div>
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
            {date ? format(new Date(date), "MMM dd, yyyy HH:mm") : "N/A"}
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
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: 10,
      },
    },
    manualPagination: true,
    pageCount,
  });

  const handlePageChange = (page: number) => {
    router.push(`/reports?page=${page}&limit=10`);
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
            {table.getRowModel().rows.length ? (
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

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * 10 + 1, totalItems)} to{" "}
          {Math.min(currentPage * 10, totalItems)} of {totalItems} entries
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          Next
        </Button>
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
