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
import { Loader2, Pencil, Trash2 } from "lucide-react";

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

// Define the API data type
interface APIUser {
  id: string;
  userName: string;
  status: "active" | "inactive" | null;
  email: string;
  role: "user" | "admin" | "superAdmin";
  companyId: string | null | undefined;
  modifiedBy: string | null;
  dateCreated: Date;
  lastLogin: Date | null;
  company?: { companyName: string };
}

// Map API data to match the User type
const mapApiUserToUser = (apiUser: APIUser): User => {
  return {
    ...apiUser,
    userId: apiUser.id,
  };
};

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
  const currentUserId = profileData?.user.id;

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

  const utils = api.useUtils();

  const deleteUserMutation = api.user.deleteUser.useMutation({
    onSuccess: async () => {
      // Close the dialog and reset the state
      setIsDeleteDialogOpen(false);
      setDeleteUserId(null);

      // Refresh all user data queries
      await utils.user.getAllUsers.invalidate();
      await utils.user.getAdminUsers.invalidate();
      await utils.user.getAllGeneralUser.invalidate();

      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete user", {
        description: error.message,
      });
      // Close the dialog but keep the userId in case they want to retry
      setIsDeleteDialogOpen(false);
    },
  });

  // Set defaults based on role
  useEffect(() => {
    if (isAdmin) {
      // If admin, default to admin users
      setUserType("admin");
    }
  }, [isAdmin]);

  // Determine which data to use based on user role and selected user type and map it to the User type
  const currentData = (() => {
    if (isSuperAdmin) {
      // SuperAdmin can see all types
      const data =
        userType === "all"
          ? allUsersData
          : userType === "admin"
            ? adminUsersData
            : generalUsersData;

      // Map the data if it exists
      return data
        ? {
            ...data,
            data: data.data.map(mapApiUserToUser),
          }
        : null;
    } else if (isAdmin) {
      // Admin can only see admin and general users
      const data = userType === "admin" ? adminUsersData : generalUsersData;

      // Map the data if it exists
      return data
        ? {
            ...data,
            data: data.data.map(mapApiUserToUser),
          }
        : null;
    }
    return null;
  })();

  const isLoading =
    isLoadingAllUsers || isLoadingAdminUsers || isLoadingGeneralUsers;

  const handleDeleteUser = () => {
    if (deleteUserId && currentUserId) {
      // Get user from the current data (before mapping)
      let userToDelete;
      if (userType === "all" && allUsersData) {
        userToDelete = allUsersData.data.find(
          (user) => user.id === deleteUserId,
        );
      } else if (userType === "admin" && adminUsersData) {
        userToDelete = adminUsersData.data.find(
          (user) => user.id === deleteUserId,
        );
      } else if (userType === "general" && generalUsersData) {
        userToDelete = generalUsersData.data.find(
          (user) => user.id === deleteUserId,
        );
      }

      if (userToDelete) {
        deleteUserMutation.mutate({
          userId: deleteUserId,
          modifiedBy: currentUserId,
          role: userToDelete.role,
        });
      } else {
        toast.error("Could not find user data");
      }
    }
  };

  const openDeleteDialog = (userId: string) => {
    setDeleteUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  // Define pagination handlers for the new Pagination component
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

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "userName",
      header: "Name",
      cell: ({ row }) => <div>{row.original.userName || "Not specified"}</div>,
    },
    {
      accessorKey: "userId",
      header: "ID",
      cell: ({ row }) => <div>{row.original.userId || "Not specified"}</div>,
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
        return row.original.lastLogin
          ? format(new Date(row.original.lastLogin), "MMM dd, yyyy")
          : "Never";
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
              onClick={() => openDeleteDialog(user.userId)}
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

  // Calculate values for the new Pagination component
  const currentPage = pagination.pageIndex + 1; // Convert from 0-indexed to 1-indexed
  const pageSize = pagination.pageSize;
  const totalItems = currentData?.total ?? 0;
  const totalPages = currentData
    ? Math.ceil(currentData.total / currentData.limit)
    : 0;

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
            {/* Only show the user type selector for super admins and admins */}
            {(isSuperAdmin || isAdmin) && (
              <Select
                value={userType}
                onValueChange={(value) => {
                  setUserType(value as "all" | "admin" | "general");
                  // Reset to first page when changing user type
                  setPagination({
                    ...pagination,
                    pageIndex: 0,
                  });
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && (
                    <SelectItem value="all">All Users</SelectItem>
                  )}
                  <SelectItem value="admin">Admin Users</SelectItem>
                  <SelectItem value="general">General Users</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Only show add user button for admins and super admins */}
            {(isSuperAdmin || isAdmin) && (
              <AddUserModal>
                <Button className="bg-blue-500 text-white hover:bg-blue-600">
                  Add User
                </Button>
              </AddUserModal>
            )}
          </div>
        </div>

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
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </div>
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
                    No results.
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
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
