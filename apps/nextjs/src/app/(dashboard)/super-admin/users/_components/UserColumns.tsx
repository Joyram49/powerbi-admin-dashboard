"use client";

import type { Column, ColumnDef, Row, Table } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowUpDown, UserPlus } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";

import { UpdatePasswordForm } from "~/app/(auth)/_components/UpdatePasswordForm";
import { EntityActions } from "~/app/(dashboard)/_components/EntityActions";
import { api } from "~/trpc/react";
import UserModal from "./UserModal";

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
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
              className="text-left font-medium dark:hover:bg-gray-900"
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
          console.log("row.original", row.original);
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
        header: () => <div className="text-left font-medium">Role</div>,
        cell: ({ row }) => {
          const role = row.getValue("role");
          return (
            <Badge
              variant={
                role === "admin"
                  ? "default"
                  : role === "superAdmin"
                    ? "destructive"
                    : "outline"
              }
              className={`border-primary ${
                role === "admin" ? "bg-primary text-white" : ""
              }`}
            >
              {role as string}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="text-center font-medium dark:hover:bg-gray-900"
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="flex justify-center">
              <Badge variant={status === "active" ? "success" : "destructive"}>
                {(status as string) || "N/A"}
              </Badge>
            </div>
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
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => {
                  if (sorting?.onSortChange) {
                    sorting.onSortChange("dateCreated");
                  } else {
                    column.toggleSorting(column.getIsSorted() === "asc");
                  }
                }}
                className="text-center font-medium dark:hover:bg-gray-900"
              >
                Created At
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const dateCreated = row.original.dateCreated;
          return (
            <div className="flex justify-center">
              {format(new Date(dateCreated), "MMM dd, yyyy")}
            </div>
          );
        },
      },
      {
        accessorKey: "lastLogin",
        header: () => <div className="text-left font-medium">Last Login</div>,
        cell: ({ row }) => {
          return (
            <div className="text-left">
              {row.original.lastLogin
                ? format(new Date(row.original.lastLogin), "MMM dd, yyyy")
                : "Never"}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original;
          console.log("user", user);
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
                    setSelectedUserId(user.id);
                    setIsEditModalOpen(true);
                  },
                }}
                deleteAction={{
                  onDelete: async () => {
                    // Check if the user is an admin
                    if (user.role === "admin") {
                      // Check if admin is associated with any company
                      if (user.company && user.companyId) {
                        throw new Error(
                          `This admin is currently associated with company: ${user.company.companyName}. Please remove the company association before deleting this user.`,
                        );
                      }

                      // Get companies where this admin is the company admin
                      const adminCompanies =
                        await utils.company.getCompaniesByAdminId.fetch({
                          companyAdminId: user.id,
                        });

                      if (adminCompanies.data.length > 0) {
                        throw new Error(
                          `This admin is currently managing the following companies: ${adminCompanies.data.map((c) => c.companyName).join(", ")}. Please reassign these companies to another admin before deleting this admin.`,
                        );
                      }
                    }

                    // Proceed with deletion if admin has no companies or user is not an admin
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
                    user.role === "admin"
                      ? `Are you sure you want to delete this admin account? ${
                          user.company
                            ? `\n\nAssociated Companies: ${user.company.companyName}. Want to delete Associated Admin: `
                            : ""
                        }`
                      : "Are you sure you want to delete this user account? All associated data will be lost.",
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
                    await utils.user.getUsersByReportId.invalidate();
                  }}
                />
              )}

              {/* Edit Modal */}
              {selectedUserId === user.id && (
                <UserModal
                  userId={selectedUserId}
                  isOpen={isEditModalOpen}
                  setIsOpen={setIsEditModalOpen}
                  type="edit"
                  triggerButton={false}
                  onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedUserId(undefined);
                  }}
                />
              )}
            </>
          );
        },
      },
    ];

    return columns;
  }, [
    deleteMutation,
    utils,
    selectedUserForPasswordReset,
    currentUserId,
    selectedUserId,
    isEditModalOpen,
  ]);
}

export default useUserColumns;
