"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Skeleton } from "@acme/ui/skeleton";

import { api } from "~/trpc/react";
import { UserForm } from "./UserForm";

interface UserModalProps {
  userId?: string;
  companyId?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onClose?: (shouldRefresh?: boolean) => void;
  triggerButton?: boolean;
  type?: "add" | "edit";
}

const UserModal: React.FC<UserModalProps> = ({
  userId,
  companyId,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  onClose,
  triggerButton = true,
  type = "add",
}) => {
  // Internal state for uncontrolled usage
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Determine if we're using controlled or uncontrolled mode
  const isControlled =
    externalIsOpen !== undefined && externalSetIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;
  const setIsOpen = isControlled ? externalSetIsOpen : setInternalIsOpen;

  // Fetch user data if in edit mode
  const { data: userData, isLoading } = api.user.getUserById.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId && type === "edit" },
  );

  const handleClose = (shouldRefresh = false) => {
    setIsOpen(false);
    if (onClose) {
      onClose(shouldRefresh);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        } else {
          setIsOpen(true);
        }
      }}
    >
      {triggerButton && (
        <DialogTrigger asChild>
          <Button className="bg-blue-500 text-white shadow-sm transition-all duration-200 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
            <Plus className="mr-1 h-4 w-4" />
            {type === "edit" ? "Edit user" : "Add user"}
          </Button>
        </DialogTrigger>
      )}
      {isOpen && (
        <DialogContent className="border-gray-200 bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:max-w-lg">
          <DialogHeader className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {type === "edit" ? "Edit User" : "Add New User"}
              </DialogTitle>
            </motion.div>
          </DialogHeader>
          <div className="p-6">
            {isLoading && type === "edit" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ) : (
              <UserForm
                initialData={userData?.user ?? undefined}
                onClose={handleClose}
                companyId={companyId}
              />
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default UserModal;
