"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileBarChart, X } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

import ReportForm from "./ReportForm";

const ReportModalButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 text-white shadow-sm transition-all duration-200 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
          <FileBarChart className="mr-1 h-4 w-4" />
          Add report
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-auto border-none bg-transparent p-0 shadow-none sm:max-w-4xl"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="Add report dialog box"
      >
        <DialogTitle className="sr-only">Add report dialog</DialogTitle>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full bg-gray-100 p-0 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
            <ReportForm
              onClose={() => setIsOpen(false)}
              userRole="superAdmin"
            />
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModalButton;
