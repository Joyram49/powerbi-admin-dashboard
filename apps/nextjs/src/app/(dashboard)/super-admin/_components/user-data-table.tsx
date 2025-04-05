"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { api } from "~/trpc/react";

export function UsersDataTable() {
  const router = useRouter();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [userType, setUserType] = useState<"all" | "admin" | "general">("all");

  // Fetch users based on the selected user type
  const { data: usersData, isLoading } = api.user.getAllUsers.useQuery(
    {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    },
    {
      enabled: userType === "all",
    },
  );

  const { data: adminUsersData } = api.user.getAdminUsers.useQuery(
    {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    },
    {
      enabled: userType === "admin",
    },
  );

  const { data: generalUsersData } = api.user.getAllGeneralUser.useQuery(
    {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    },
    {
      enabled: userType === "general",
    },
  );

  // Get the appropriate data based on the selected user type
  const currentData =
    userType === "all"
      ? usersData
      : userType === "admin"
        ? adminUsersData
        : generalUsersData;

  const deleteUserMutation = api.user.deleteUser.useMutation({
    onSuccess: () => {
      // Refresh the data after deletion
      table.resetPageIndex();
    },
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "userName",
      header: "Name",
      cell: ({ row }) => <div>{row.original.userName || "Not specified"}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role");
        return (
          <Badge
            variant={
              role === "admin"
                ? "secondary"
                : role === "superAdmin"
                  ? "destructive"
                  : "outline"
            }
          >
            {role as string}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <Badge variant={status === "active" ? "success" : "destructive"}>
            {status as string}
          </Badge>
        );
      },
    },
    {
      accessorKey: "company.companyName",
      header: "Company",
      cell: ({ row }) => (
        <div>{row.original.company?.companyName ?? "Not assigned"}</div>
      ),
    },
    {
      accessorKey: "dateCreated",
      header: "Created",
      cell: ({ row }) => {
        return format(new Date(row.original.dateCreated), "MMM dd, yyyy");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/users/edit/${user.id}`)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  if (
                    window.confirm("Are you sure you want to delete this user?")
                  ) {
                    deleteUserMutation.mutate({
                      userId: user.id,
                      modifiedBy: "CURRENT_USER_ID", // Replace with actual ID from context
                      role: user.role,
                    });
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable<User>({
    data: currentData?.data ?? [],
    columns,
    pageCount: currentData
      ? Math.ceil(currentData.total / currentData.limit)
      : -1,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
      sorting,
      columnFilters,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Filter emails..."
              value={
                (table.getColumn("email")?.getFilterValue() as string) || ""
              }
              onChange={(event) =>
                table.getColumn("email")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Select
              value={userType}
              onValueChange={(value) => {
                setUserType(value as "all" | "admin" | "general");
                setPagination({ pageIndex: 0, pageSize: 10 });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admin">Admin Users</SelectItem>
                <SelectItem value="general">General Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => router.push("/super-admin/users/add")}
          >
            Add User
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
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
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {currentData?.total
              ? `Showing ${pagination.pageIndex * pagination.pageSize + 1} to ${Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  currentData.total,
                )} of ${currentData.total} users`
              : "No users found"}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
