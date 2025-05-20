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
    // Removed editForm and made onEdit a general callback
  };
  deleteAction?: {
    onDelete: () => Promise<void>;
    title?: string;
    description?: string;
    confirmLabel?: string;
  };
  disableAction?: {
    onDisable: () => Promise<void>;
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
  disableAction,
}: EntityActionsProps<T>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isDisablePending, setIsDisablePending] = useState(false);
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
    if (editAction?.onEdit) {
      setTimeout(() => {
        editAction.onEdit();
      }, 100);
    }
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

  const handleDisable = async () => {
    if (!disableAction) return;

    setIsDisablePending(true);
    try {
      await disableAction.onDisable();
      toast.success(`${entityName} Disabled`, {
        description: `${entityDisplayName} has been successfully disabled.`,
      });
      router.refresh();
      setIsDisableDialogOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      toast.error("Disable Failed", {
        description:
          errorMessage || `Failed to disable ${entityName.toLowerCase()}`,
      });
    } finally {
      setIsDisablePending(false);
    }
  };
  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        >
          <DropdownMenuLabel className="dark:text-gray-200">
            Actions
          </DropdownMenuLabel>

          {/* Copy actions */}
          {copyActions.length > 0 && (
            <>
              {copyActions.map((action, index) => (
                <DropdownMenuItem
                  key={`copy-${index}`}
                  onClick={() => handleCopyAction(action.field)}
                  className="cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="dark:bg-gray-700" />
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
                action.className ??
                "cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
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
              className="cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit | {entityDisplayName}
            </DropdownMenuItem>
          )}

          {/* Delete action */}
          {deleteAction && (
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="cursor-pointer text-red-500 hover:!bg-red-50 dark:text-red-600 dark:hover:!bg-red-900 dark:hover:text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete | {entityDisplayName}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      {deleteAction && isDeleteDialogOpen && (
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) setIsDeleteDialogOpen(false);
          }}
        >
          <DialogContent className="dark:border-gray-700 dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {deleteAction.title ?? `Delete ${entityName}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="dark:text-gray-200">
                {deleteAction.description ??
                  `Are you sure you want to delete the ${entityName.toLowerCase()}: `}
                <strong>{entityDisplayName}</strong>?
              </p>
              <p className="text-sm text-red-500 dark:text-red-600">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeletePending}
                  className="dark:bg-red-700 dark:hover:bg-red-600"
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

      {/* Disable Confirmation Dialog */}
      {disableAction && isDisableDialogOpen && (
        <Dialog
          open={isDisableDialogOpen}
          onOpenChange={(open) => {
            if (!open) setIsDisableDialogOpen(false);
          }}
        >
          <DialogContent className="dark:border-gray-700 dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {disableAction.title ?? `Disable ${entityName}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="dark:text-gray-200">
                {disableAction.description ??
                  `Are you sure you want to disable the ${entityName.toLowerCase()}: `}
                <strong>{entityDisplayName}</strong>?
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDisableDialogOpen(false)}
                  className="dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={isDisablePending}
                  className="dark:bg-red-700 dark:hover:bg-red-600"
                >
                  {isDisablePending
                    ? "Disabling..."
                    : (disableAction.confirmLabel ?? "Disable")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
