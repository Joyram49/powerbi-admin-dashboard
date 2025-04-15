"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

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
}

const UserModal: React.FC<UserModalProps> = ({ initialData }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 text-white shadow-sm transition-all duration-200 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
          <Plus className="mr-1 h-4 w-4" />
          Add user
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-0 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:max-w-lg">
          <Card className="border-none shadow-none">
            <CardHeader className="relative border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CardTitle className="flex items-center text-xl font-bold sm:text-2xl">
                  {initialData ? "Edit User" : "Add New User"}
                </CardTitle>
              </motion.div>
            </CardHeader>

            <CardContent className="pt-6">
              <UserForm
                initialData={initialData}
                onClose={() => setOpen(false)}
              />
            </CardContent>
          </Card>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default UserModal;
