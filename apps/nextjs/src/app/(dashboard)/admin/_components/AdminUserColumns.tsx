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
import UserModal from "../../super-admin/users/_components/UserModal";

interface CompanyUserType {
  id: string;
  userName: string;
  email: string;
  role: "user" | "admin" | "superAdmin";
  status: "active" | "inactive" | null;
  dateCreated: Date;
  lastLogin: Date | null;
  companyId?: string | null;
  modifiedBy: string | null;
  isSuperAdmin: boolean;
  passwordHistory: string[] | null;
  company: {
    companyName: string;
  } | null;
}

interface TableMeta {
  sorting?: {
    sortBy?: "userName" | "dateCreated";
    onSortChange: (sortBy: "userName" | "dateCreated") => void;
  };
}

export function useUserColumns() {
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

  const columns = useMemo(() => {
    const columns: ColumnDef<CompanyUserType>[] = [
      {
        id: "select",
        header: ({ table }: { table: Table<CompanyUserType> }) => (
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
        cell: ({ row }: { row: Row<CompanyUserType> }) => (
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
          column: Column<CompanyUserType>;
          table: Table<CompanyUserType>;
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
        cell: ({ row }: { row: Row<CompanyUserType> }) => (
          <div>{row.original.userName || "Not specified"}</div>
        ),
      },
      {
        accessorKey: "id",
        header: () => <div className="text-left font-medium">ID</div>,
        cell: ({ row }: { row: Row<CompanyUserType> }) => {
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
        cell: ({ row }: { row: Row<CompanyUserType> }) => (
          <div>{row.original.email}</div>
        ),
      },
      {
        accessorKey: "role",
        header: () => <div className="text-center font-medium">Role</div>,
        cell: ({ row }: { row: Row<CompanyUserType> }) => {
          const role = row.getValue("role");
          return (
            <Badge
              variant={
                role === "admin"
                  ? "default"
                  : role === "superAdmin"
                    ? "destructive"
                    : "secondary"
              }
              className="justify-center text-white"
            >
              {role as string}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center font-medium">Status</div>,
        cell: ({ row }: { row: Row<CompanyUserType> }) => {
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
        cell: ({ row }: { row: Row<CompanyUserType> }) => (
          <div>{row.original.company?.companyName ?? "Not assigned"}</div>
        ),
      },
      {
        accessorKey: "dateCreated",
        header: ({
          column,
          table,
        }: {
          column: Column<CompanyUserType>;
          table: Table<CompanyUserType>;
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
                className="flex items-center justify-center font-medium hover:bg-slate-100 dark:hover:bg-gray-900"
              >
                Created At
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          );
        },
        cell: ({ row }: { row: Row<CompanyUserType> }) => {
          return (
            <div className="text-center">
              {format(new Date(row.original.dateCreated), "MMM dd, yyyy")}
            </div>
          );
        },
      },
      {
        accessorKey: "lastLogin",
        header: () => <div className="text-center font-medium">Last Login</div>,
        cell: ({ row }: { row: Row<CompanyUserType> }) => {
          return row.original.lastLogin
            ? format(new Date(row.original.lastLogin), "MMM dd, yyyy")
            : "Never";
        },
      },
      {
        id: "actions",
        cell: ({ row }: { row: Row<CompanyUserType> }) => {
          const user = row.original;

          return (
            <EntityActions<CompanyUserType>
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
                  await deleteMutation.mutateAsync({
                    userId: user.id,
                    role: user.role,
                    modifiedBy: currentUserId ?? "",
                  });
                  await utils.user.getAdminUsers.invalidate();
                  await utils.user.getAllGeneralUser.invalidate();
                  await utils.user.getUsersByCompanyId.invalidate();
                },
                title: "Delete User Account",
                description:
                  "Are you sure you want to delete this user account? All associated data will be lost.",
              }}
            />
          );
        },
      },
    ];

    return columns;
  }, [deleteMutation, utils, currentUserId]);

  // Render modals outside of columns definition
  const modals = (
    <>
      {/* Password Reset Modal */}
      {selectedUserForPasswordReset && (
        <UpdatePasswordForm
          isModal
          isOpen={selectedUserForPasswordReset.isOpen}
          onClose={() => setSelectedUserForPasswordReset(null)}
          userId={selectedUserForPasswordReset.id}
          onSuccess={async () => {
            setSelectedUserForPasswordReset(null);
            await utils.user.getAdminUsers.invalidate();
            await utils.user.getAllGeneralUser.invalidate();
            await utils.user.getUsersByCompanyId.invalidate();
          }}
        />
      )}

      {/* Edit Modal */}
      {selectedUserId && (
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

  return { columns, modals };
}

export default useUserColumns;
