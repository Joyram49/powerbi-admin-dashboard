import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { toast } from "@acme/ui/toast";

import type { Company } from "~/types/company";
import { api } from "~/trpc/react";
import CompanyAdminForm from "./CompanyForm";

export function CompanyActions({ company }: { company: Company }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  // Delete company mutation
  const deleteCompanyMutation = api.company.deleteCompany.useMutation({
    onSuccess: () => {
      toast.success("Company Deleted", {
        description: `${company.companyName} has been successfully deleted.`,
      });
      router.refresh();
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Delete Failed", {
        description: error.message || "Failed to delete company",
      });
    },
  });

  const handleDeleteCompany = () => {
    deleteCompanyMutation.mutate({ companyId: company.id });
  };

  // Fix: Use a controlled pattern for dropdown and actions
  const handleEditClick = () => {
    // First fully close the dropdown
    setIsDropdownOpen(false);

    // Use a longer timeout to ensure dropdown is fully closed
    setTimeout(() => {
      setIsEditModalOpen(true);
    }, 100);
  };

  const handleDeleteClick = () => {
    // First fully close the dropdown
    setIsDropdownOpen(false);

    // Use a longer timeout to ensure dropdown is fully closed
    setTimeout(() => {
      setIsDeleteDialogOpen(true);
    }, 100);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="dark:bg-slate-800">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(company.id);
              } catch (err) {
                console.error("Failed to copy:", err);
              }
              setIsDropdownOpen(false);
            }}
            className="cursor-pointer hover:dark:bg-slate-900"
          >
            Copy Company ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await navigator.clipboard.writeText(company.admin.id);
              setIsDropdownOpen(false);
            }}
            className="cursor-pointer hover:dark:bg-slate-900"
          >
            Copy Company Admin ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {/* Edit Company Action */}
          <DropdownMenuItem
            onClick={handleEditClick}
            className="cursor-pointer hover:dark:bg-slate-900"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit | {company.companyName}
          </DropdownMenuItem>

          {/* Delete Company Action */}
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="cursor-pointer text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/30"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete | {company.companyName}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Company Modal - Only render when needed */}
      {isEditModalOpen && (
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) setIsEditModalOpen(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
            </DialogHeader>
            <CompanyAdminForm
              initialData={company}
              onClose={() => setIsEditModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog - Only render when needed */}
      {isDeleteDialogOpen && (
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) setIsDeleteDialogOpen(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete the company:{" "}
                <strong>{company.companyName}</strong>?
              </p>
              <p className="text-sm text-red-500">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCompany}
                  disabled={deleteCompanyMutation.isPending}
                >
                  {deleteCompanyMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
