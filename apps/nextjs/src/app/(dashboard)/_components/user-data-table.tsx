"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
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
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { Pagination } from "./Pagination";
import AddUserModal from "./UserModal";
import UserModal from "./UserModal";

export function UsersDataTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [userType, setUserType] = useState<"all" | "admin" | "general">("all");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { data: profileData } = api.auth.getProfile.useQuery();
  const userRole = profileData?.user.user_metadata.role as string;

  // Determine which queries should be enabled based on user role
  const isSuperAdmin = userRole === "superAdmin";
  const isAdmin = userRole === "admin";

  // For superAdmin, fetch all users when userType is "all"
  const { data: allUsersData, isLoading: isLoadingAllUsers } =
    api.user.getAllUsers.useQuery(
      {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      },
      {
        enabled: isSuperAdmin && userType === "all",
      },
    );

  // Fetch admin users for both superAdmin and admin roles when userType is "admin"
  const { data: adminUsersData, isLoading: isLoadingAdminUsers } =
    api.user.getAdminUsers.useQuery(
      {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      },
      {
        enabled: (isSuperAdmin || isAdmin) && userType === "admin",
      },
    );

  // Fetch general users when userType is "general"
  const { data: generalUsersData, isLoading: isLoadingGeneralUsers } =
    api.user.getAllGeneralUser.useQuery(
      {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      },
      {
        enabled: (isSuperAdmin || isAdmin) && userType === "general",
      },
    );
  const deleteUserMutation = api.user.deleteUser.useMutation({
    onSuccess: () => {
      // Refresh the data after deletion
      table.resetPageIndex();
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete user", {
        description: error.message,
      });
    },
  });
  // Set defaults based on role
  useEffect(() => {
    if (isAdmin) {
      // If admin, default to admin users
      setUserType("admin");
    }
  }, [isAdmin]);

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

  const isLoading =
    isLoadingAllUsers || isLoadingAdminUsers || isLoadingGeneralUsers;
  const handleDeleteUser = () => {
    if (deleteUserId) {
      deleteUserMutation.mutate({
        userId: deleteUserId,
        modifiedBy: profileData?.user.id ?? "SYSTEM",
        role:
          currentData?.data.find((user) => user.id === deleteUserId)?.role ??
          "user",
      });
    }
  };

  const openDeleteDialog = (userId: string) => {
    setDeleteUserId(userId);
    setIsDeleteDialogOpen(true);
  };
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "userName",
      header: "Name",
      cell: ({ row }) => <div>{row.original.userName || "Not specified"}</div>,
    },
    {
      accessorKey: "ID",
      header: "id",
      cell: ({ row }) => <div>{row.original.id ?? "Not specified"}</div>,
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
      accessorKey: "lastLogin",
      header: "Last login",
      cell: ({ row }) => {
        return format(new Date(row.original.lastLogin), "MMM dd, yyyy");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="flex items-center space-x-2">
            <UserModal user={user}>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </UserModal>

            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => openDeleteDialog(user.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
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
            {/* Only show the user type selector for superAdmin */}
            {isSuperAdmin && (
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
            )}
            {/* For admin, show a simplified selector */}
            {isAdmin && (
              <Select
                value={userType}
                onValueChange={(value) => {
                  setUserType(value as "admin" | "general");
                  setPagination({ pageIndex: 0, pageSize: 10 });
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin Users</SelectItem>
                  <SelectItem value="general">General Users</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <AddUserModal />
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
          <Pagination
            currentPage={pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            totalItems={currentData?.total}
            pageSize={pagination.pageSize}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            onPageSizeChange={(size) => table.setPageSize(size)}
            showSelectedRowsCount={false}
            pageSizeOptions={[10, 20, 30, 40, 50]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
