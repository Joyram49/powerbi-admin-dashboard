"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
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
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-0 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:max-w-lg">
          <Card className="border-none bg-white shadow-none dark:bg-gray-900">
            <CardHeader className="relative border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="dark:bg-gray-900"
              >
                <CardTitle className="flex items-center text-xl font-bold dark:text-white sm:text-2xl">
                  {initialData ? "Edit User" : "Add New User"}
                </CardTitle>
              </motion.div>
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="bg-white pt-6 dark:bg-gray-900">
              <UserForm
                initialData={initialData}
                onClose={() => setOpen(false)}
                companyId={companyId}
              />
            </CardContent>
          </Card>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default UserModal;
