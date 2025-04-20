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

import { UserForm } from "./UserForm";

interface UserModalProps {
  initialData?: User;
  companyId?: string;
}

const UserModal: React.FC<UserModalProps> = ({ initialData, companyId }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 text-white shadow-sm transition-all duration-200 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
          <Plus className="mr-1 h-4 w-4" />
          {initialData ? "Edit user" : "Add user"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-gray-200 bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:max-w-lg">
        <DialogHeader className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {initialData ? "Edit User" : "Add New User"}
            </DialogTitle>
          </motion.div>
        </DialogHeader>
        <div className="p-6">
          <UserForm
            initialData={initialData}
            onClose={() => setOpen(false)}
            setDialogOpen={setOpen}
            companyId={companyId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
