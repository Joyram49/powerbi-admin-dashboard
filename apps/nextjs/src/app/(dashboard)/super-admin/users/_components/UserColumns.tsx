"use client";

import type { Column, ColumnDef, Row, Table } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowUpDown, UserPlus } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";

import { UpdatePasswordForm } from "~/app/(auth)/_components/UpdatePasswordForm";
import { EntityActions } from "~/app/(dashboard)/_components/EntityActions";
import { api } from "~/trpc/react";
import { UserForm } from "./UserForm";

interface TableMeta {
  sorting?: {
    sortBy?: "userName" | "dateCreated";
    onSortChange: (sortBy: "userName" | "dateCreated") => void;
  };
}

export function useUserColumns() {
  // Move hook calls inside the custom hook
  const utils = api.useUtils();
  const deleteMutation = api.user.deleteUser.useMutation();
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] =
    useState<{
      id: string;
      isOpen: boolean;
    } | null>(null);

  const { data: profileData } = api.auth.getProfile.useQuery();
  const currentUserId = profileData?.user?.id;

  return useMemo(() => {
    const columns: ColumnDef<User>[] = [
      {
        id: "select",
        header: ({ table }: { table: Table<User> }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border border-slate-800 checked:border-blue-500 checked:bg-white dark:border-slate-50 dark:checked:bg-slate-800"
          />
        ),
        cell: ({ row }: { row: Row<User> }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border border-slate-800 checked:border-blue-500 checked:bg-white dark:border-slate-50 dark:checked:bg-slate-800"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "userName",
        header: ({
          column,
          table,
        }: {
          column: Column<User>;
          table: Table<User>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <Button
              variant="ghost"
              onClick={() => {
                if (sorting?.onSortChange) {
                  sorting.onSortChange("userName");
                } else {
                  column.toggleSorting(column.getIsSorted() === "asc");
                }
              }}
              className="text-left font-medium"
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>{row.original.userName || "Not specified"}</div>
        ),
      },
      {
        accessorKey: "id",
        header: () => <div className="text-left font-medium">ID</div>,
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <div className="text-left">
              <span className="hidden xl:inline">{id}</span>
              <span className="xl:hidden">{id.slice(0, 10)}...</span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: () => <div className="text-left font-medium">Email</div>,
      },
      {
        accessorKey: "role",
        header: () => <div className="text-center font-medium">Role</div>,
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
              className="justify-center"
            >
              {role as string}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center font-medium">Status</div>,
        cell: ({ row }) => {
          const status = row.getValue("status");
          return (
            <Badge
              variant={status === "active" ? "success" : "destructive"}
              className="justify-center"
            >
              {(status as string) || "N/A"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "company.companyName",
        header: () => <div className="text-left font-medium">Company</div>,
        cell: ({ row }) => (
          <div>{row.original.company?.companyName ?? "Not assigned"}</div>
        ),
      },
      {
        accessorKey: "dateCreated",
        header: ({
          column,
          table,
        }: {
          column: Column<User>;
          table: Table<User>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <Button
              variant="ghost"
              onClick={() => {
                if (sorting?.onSortChange) {
                  sorting.onSortChange("dateCreated");
                } else {
                  column.toggleSorting(column.getIsSorted() === "asc");
                }
              }}
              className="text-center font-medium"
            >
              Created At
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return format(new Date(row.original.dateCreated), "MMM dd, yyyy");
        },
      },
      {
        accessorKey: "lastLogin",
        header: () => <div className="text-center font-medium">Last Login</div>,
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
            <>
              <EntityActions<User>
                entity={user}
                entityName="User"
                entityDisplayField="userName"
                copyActions={[
                  { label: "Copy User ID", field: "id" },
                  { label: "Copy Email", field: "email" },
                ]}
                customActions={[
                  {
                    label: "Reset Password",
                    icon: <UserPlus className="h-4 w-4" />,
                    onClick: () => {
                      setSelectedUserForPasswordReset({
                        id: user.id,
                        isOpen: true,
                      });
                    },
                  },
                ]}
                editAction={{
                  onEdit: () => {
                    // This is handled by EntityActions component
                  },
                  editForm: (
                    <UserForm
                      initialData={user}
                      onClose={async () => {
                        await utils.user.getAllUsers.invalidate();
                        await utils.user.getAdminUsers.invalidate();
                        await utils.user.getAllGeneralUser.invalidate();
                        await utils.user.getUsersByCompanyId.invalidate();
                      }}
                    />
                  ),
                }}
                deleteAction={{
                  onDelete: async () => {
                    await deleteMutation.mutateAsync({
                      userId: user.id,
                      role: user.role,
                      modifiedBy: currentUserId ?? "",
                    });
                    await utils.user.getAllUsers.invalidate();
                    await utils.user.getAdminUsers.invalidate();
                    await utils.user.getAllGeneralUser.invalidate();
                    await utils.user.getUsersByCompanyId.invalidate();
                  },
                  title: "Delete User Account",
                  description:
                    "Are you sure you want to delete this user account? All associated data will be lost.",
                }}
              />

              {/* Password Reset Modal */}
              {selectedUserForPasswordReset?.id === user.id && (
                <UpdatePasswordForm
                  isModal
                  isOpen={selectedUserForPasswordReset.isOpen}
                  onClose={() => setSelectedUserForPasswordReset(null)}
                  userId={user.id}
                  onSuccess={async () => {
                    setSelectedUserForPasswordReset(null);
                    await utils.user.getAllUsers.invalidate();
                    await utils.user.getAdminUsers.invalidate();
                    await utils.user.getAllGeneralUser.invalidate();
                    await utils.user.getUsersByCompanyId.invalidate();
                  }}
                />
              )}
            </>
          );
        },
      },
    ];

    return columns;
  }, [deleteMutation, utils, selectedUserForPasswordReset, currentUserId]);
}

export default useUserColumns;
