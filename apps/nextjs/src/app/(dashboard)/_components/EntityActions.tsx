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

interface EntityAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  className?: string;
}

interface EntityActionsProps<T> {
  entity: T;
  entityName: string;
  entityDisplayField: keyof T;
  copyActions?: {
    label: string;
    field: keyof T | ((entity: T) => string);
  }[];
  customActions?: EntityAction[];
  editAction?: {
    onEdit: () => void;
    editForm: React.ReactNode;
    title?: string;
  };
  deleteAction?: {
    onDelete: () => Promise<void>;
    title?: string;
    description?: string;
    confirmLabel?: string;
  };
}

export function EntityActions<T>({
  entity,
  entityName,
  entityDisplayField,
  copyActions = [],
  customActions = [],
  editAction,
  deleteAction,
}: EntityActionsProps<T>) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const router = useRouter();

  const entityDisplayName = String(entity[entityDisplayField]);

  const handleCopyAction = async (field: keyof T | ((entity: T) => string)) => {
    try {
      const textToCopy =
        typeof field === "function" ? field(entity) : String(entity[field]);

      await navigator.clipboard.writeText(textToCopy);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
    setIsDropdownOpen(false);
  };

  const handleEditClick = () => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      setIsEditModalOpen(true);
    }, 100);
  };

  const handleDeleteClick = () => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      setIsDeleteDialogOpen(true);
    }, 100);
  };

  const handleDelete = async () => {
    if (!deleteAction) return;

    setIsDeletePending(true);
    try {
      await deleteAction.onDelete();
      toast.success(`${entityName} Deleted`, {
        description: `${entityDisplayName} has been successfully deleted.`,
      });
      router.refresh();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      toast.error("Delete Failed", {
        description:
          errorMessage || `Failed to delete ${entityName.toLowerCase()}`,
      });
    } finally {
      setIsDeletePending(false);
    }
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

          {/* Copy actions */}
          {copyActions.length > 0 && (
            <>
              {copyActions.map((action, index) => (
                <DropdownMenuItem
                  key={`copy-${index}`}
                  onClick={() => handleCopyAction(action.field)}
                  className="cursor-pointer hover:dark:bg-slate-900"
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Custom actions */}
          {customActions.map((action, index) => (
            <DropdownMenuItem
              key={`custom-${index}`}
              onClick={() => {
                setIsDropdownOpen(false);
                setTimeout(action.onClick, 100);
              }}
              className={
                action.className ?? "cursor-pointer hover:dark:bg-slate-900"
              }
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          ))}

          {/* Edit action */}
          {editAction && (
            <DropdownMenuItem
              onClick={handleEditClick}
              className="cursor-pointer hover:dark:bg-slate-900"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit | {entityDisplayName}
            </DropdownMenuItem>
          )}

          {/* Delete action */}
          {deleteAction && (
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="cursor-pointer text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/30"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete | {entityDisplayName}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      {editAction && isEditModalOpen && (
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) setIsEditModalOpen(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editAction.title ?? `Edit ${entityName}`}
              </DialogTitle>
            </DialogHeader>
            {editAction.editForm}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteAction && isDeleteDialogOpen && (
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) setIsDeleteDialogOpen(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {deleteAction.title ?? `Delete ${entityName}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                {deleteAction.description ??
                  `Are you sure you want to delete the ${entityName.toLowerCase()}: `}
                <strong>{entityDisplayName}</strong>?
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
                  onClick={handleDelete}
                  disabled={isDeletePending}
                >
                  {isDeletePending
                    ? "Deleting..."
                    : (deleteAction.confirmLabel ?? "Delete")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
