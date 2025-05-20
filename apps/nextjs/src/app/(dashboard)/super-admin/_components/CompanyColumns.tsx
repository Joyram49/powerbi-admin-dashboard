"use client";

import type { Column, ColumnDef, Row, Table } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

import type { CompanyWithAdmins } from "@acme/db/schema";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { EntityActions } from "../../_components/EntityActions";
import CompanyModal from "./CompanyModal";

interface TableMeta {
  sorting?: {
    onSortChange: (sortBy: "companyName" | "dateJoined") => void;
  };
}

export function useCompanyColumns() {
  // Hook calls inside the custom hook
  const utils = api.useUtils();
  const disableMutation = api.company.disableACompany.useMutation();
  const router = useRouter();

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<CompanyWithAdmins | null>(
    null,
  );

  return useMemo(() => {
    const columns: ColumnDef<CompanyWithAdmins>[] = [
      {
        id: "select",
        header: ({ table }: { table: Table<CompanyWithAdmins> }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border border-slate-200 checked:border-blue-500 checked:bg-white dark:border-slate-700 dark:checked:bg-slate-800"
          />
        ),
        cell: ({ row }: { row: Row<CompanyWithAdmins> }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border border-slate-200 checked:border-blue-500 checked:bg-white dark:border-slate-700 dark:checked:bg-slate-800"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        header: () => <div className="text-left font-medium">Company ID</div>,
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <div className="text-left">
              <span>{id.slice(0, 10)}...</span>
            </div>
          );
        },
      },
      {
        accessorKey: "companyName",
        header: ({
          column,
          table,
        }: {
          column: Column<CompanyWithAdmins>;
          table: Table<CompanyWithAdmins>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => {
                  if (sorting?.onSortChange) {
                    sorting.onSortChange("companyName");
                  } else {
                    column.toggleSorting(column.getIsSorted() === "asc");
                  }
                }}
                className="text-center font-medium dark:hover:bg-gray-900"
              >
                Company Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <div className="text-center font-semibold">
              {row.original.companyName}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "companyAdmin",
        header: () => <div className="text-left font-medium">Admins</div>,
        cell: ({ row }) => {
          const admins = row.original.admins;
          console.log("admins", admins);
          return (
            <Button
              variant="link"
              className="border border-slate-200 bg-gray-100 text-left hover:border-primary/90 dark:border-slate-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              onClick={() => {
                router.push(`/super-admin/users?companyId=${row.original.id}`);
              }}
            >
              {admins.length || 0}
            </Button>
          );
        },
      },
      {
        accessorKey: "email",
        header: () => <div className="text-left font-medium">Email</div>,
        cell: ({ row }) => (
          <div className="text-left">{row.original.email}</div>
        ),
      },
      {
        accessorKey: "employeeCount",
        header: () => <div className="text-left font-medium"># Employees</div>,
        cell: ({ row }) => (
          <Button
            variant="link"
            className="border border-slate-200 bg-gray-100 text-left hover:border-primary/90 dark:border-slate-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={() => {
              router.push(`/super-admin/users?companyId=${row.original.id}`);
            }}
          >
            {row.original.employeeCount}
          </Button>
        ),
      },
      {
        accessorKey: "reportCount",
        header: () => <div className="text-left font-medium"># Reports</div>,
        cell: ({ row }) => (
          <Button
            variant="link"
            className="border border-slate-200 bg-gray-100 text-left hover:border-primary/90 dark:border-slate-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={() => {
              router.push(`/super-admin/reports?companyId=${row.original.id}`);
            }}
          >
            {row.original.reportCount}
          </Button>
        ),
      },
      {
        accessorKey: "dateJoined",
        header: ({
          column,
          table,
        }: {
          column: Column<CompanyWithAdmins>;
          table: Table<CompanyWithAdmins>;
        }) => {
          const { sorting } = table.options.meta as TableMeta;
          return (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="text-center font-medium dark:hover:bg-gray-900"
                onClick={() => {
                  if (sorting?.onSortChange) {
                    sorting.onSortChange("dateJoined");
                  } else {
                    column.toggleSorting(column.getIsSorted() === "asc");
                  }
                }}
              >
                Created At
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.dateJoined
              ? new Date(row.original.dateJoined).toLocaleDateString()
              : "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "lastActivity",
        header: () => (
          <div className="text-center font-medium">Last Activity</div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.lastActivity
              ? new Date(row.original.lastActivity).toLocaleDateString()
              : "N/A"}
          </div>
        ),
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
        id: "actions",
        cell: ({ row }) => {
          const company = row.original;
          return (
            <div className="flex items-center">
              <EntityActions<CompanyWithAdmins>
                entity={company}
                entityName="Company"
                entityDisplayField="companyName"
                editAction={{
                  onEdit: () => {
                    setCompanyToEdit(company);
                    setIsEditModalOpen(true);
                  },
                }}
                customActions={[
                  {
                    label:
                      company.status === "active"
                        ? "Disable Company"
                        : "Enable Company",
                    onClick: () => {
                      void (async () => {
                        try {
                          await disableMutation.mutateAsync({
                            companyId: company.id,
                          });
                          await utils.company.getAllCompanies.invalidate();
                          toast.success(
                            `Company ${company.status === "active" ? "disabled" : "enabled"} successfully`,
                          );
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to update company status",
                          );
                        }
                      })();
                    },
                    variant:
                      company.status === "active" ? "destructive" : "default",
                    className:
                      company.status === "active"
                        ? "text-red-600 bg-red-100 border border-red-600 hover:!bg-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-400 dark:hover:!bg-red-900 dark:hover:text-white"
                        : "text-emerald-600 bg-emerald-100 border border-emerald-600 hover:!bg-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-400 dark:hover:!bg-emerald-900 dark:hover:text-white",
                  },
                ]}
                copyActions={[{ label: "Copy Company ID", field: "id" }]}
              />
              {/* Edit Modal - Rendered conditionally when edit is clicked */}
              {isEditModalOpen && companyToEdit?.id === company.id && (
                <CompanyModal
                  type="edit"
                  companyId={company.id}
                  isOpen={isEditModalOpen}
                  setIsOpen={setIsEditModalOpen}
                  onClose={() => {
                    setIsEditModalOpen(false);
                    setCompanyToEdit(null);
                  }}
                  triggerButton={false}
                />
              )}
            </div>
          );
        },
      },
    ];

    return columns;
  }, [utils, isEditModalOpen, companyToEdit, router, disableMutation]);
}

export default useCompanyColumns;
