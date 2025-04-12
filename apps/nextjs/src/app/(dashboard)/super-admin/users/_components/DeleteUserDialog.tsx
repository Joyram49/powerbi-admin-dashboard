"use client";

import { useState } from "react";
import { AlertTriangle, Trash } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";

interface DeleteUserDialogProps {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "user" | "admin" | "superAdmin";
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const DeleteUserDialog = ({
  userId,
  userName,
  userEmail,
  userRole,
  onSuccess,
  trigger,
}: DeleteUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteUserMutation = api.user.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      setOpen(false);
      setIsDeleting(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error("Failed to delete user", {
        description: error.message || "An error occurred",
      });
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    setIsDeleting(true);
    deleteUserMutation.mutate({
      userId,
      modifiedBy: userEmail,
      role: userRole,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete user</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-semibold text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Confirm User Deletion
          </DialogTitle>
          <DialogDescription className="pt-2 text-gray-600 dark:text-gray-400">
            Are you sure you want to delete the following user? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
            <div className="mb-2">
              <span className="font-medium">Username:</span> {userName}
            </div>
            <div className="mb-2">
              <span className="font-medium">Email:</span> {userEmail}
            </div>
            <div>
              <span className="font-medium">Role:</span> {userRole}
            </div>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-end gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isDeleting ? (
              <div className="flex items-center">
                <svg
                  className="mr-2 h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
              </div>
            ) : (
              <div className="flex items-center">
                <Trash className="mr-2 h-4 w-4" />
                Delete User
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserDialog;
