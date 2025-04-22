"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileBarChart } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

import ReportForm from "./ReportForm";

interface ReportModalButtonProps {
  companyId?: string;
}

const ReportModalButton = ({ companyId }: ReportModalButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 text-white shadow-sm transition-all duration-200 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
          <FileBarChart className="mr-1 h-4 w-4" />
          Add report
        </Button>
      </DialogTrigger>
      <DialogContent className="border-gray-200 bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:max-w-4xl">
        <DialogHeader className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Add Report
            </DialogTitle>
          </motion.div>
        </DialogHeader>
        <div className="p-6">
          <ReportForm
            onClose={() => setIsOpen(false)}
            setDialogOpen={setIsOpen}
            userRole="superAdmin"
            companyId={companyId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModalButton;
