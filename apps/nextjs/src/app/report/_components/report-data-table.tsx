"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  Table,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { Pagination } from "./pagination";

interface Report {
  id: string;
  reportName: string;
  company: string;
  dateCreated: string;
  userCount?: number;
  accessCount?: number;
  status: string;
  url: string;
}

interface ReportsDataTableProps {
  data: Report[];
  userRole: string | undefined;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function ReportsDataTable({
  data,
  userRole,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: ReportsDataTableProps) {
  const router = useRouter();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const deleteReportMutation = api.report.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted", {
        description: "The report has been deleted successfully.",
      });

      router.refresh();
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });

  const handleDelete = () => {
    if (reportToDelete) {
      deleteReportMutation.mutate({ reportId: reportToDelete });
      setReportToDelete(null);
    }
  };

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "reportName",
      header: "Report Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("reportName")}</div>
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

        if (userRole === "user") {
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(report.url, "_blank")}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          );
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.open(report.url, "_blank")}
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                View Report
              </DropdownMenuItem>
              {userRole === "superAdmin" && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push(`/reports/edit/${report.id}`)}
                  >
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setReportToDelete(report.id)}
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

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
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / pageSize)}
        onPageChange={onPageChange}
      />

      <Dialog
        open={!!reportToDelete}
        onOpenChange={() => setReportToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
