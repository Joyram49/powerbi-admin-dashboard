"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

import CompanyAdminForm from "./CompanyForm";

// Adjust import path as needed

const CompanyModalButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 text-white shadow-sm transition-all duration-200 hover:bg-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
            <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
            <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          Add company
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-auto border-none bg-transparent p-0 shadow-none sm:max-w-4xl"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="Add company dialog box"
      >
        <DialogTitle>Add company dialog</DialogTitle>
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
            <CompanyAdminForm onClose={() => setIsOpen(false)} />
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyModalButton;
