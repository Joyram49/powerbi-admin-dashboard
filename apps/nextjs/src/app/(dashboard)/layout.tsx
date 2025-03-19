"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Building,
  Home,
  LogOut,
  Plus,
  UserPlus,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@acme/ui/avatar";
import { ThemeToggle } from "@acme/ui/theme";

// Animation Variants
const sidebarVariants = {
  hidden: { x: -250, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950">
      {/* Sidebar */}
      <motion.aside
        className="hidden w-64 flex-col bg-slate-900 text-white dark:bg-slate-800 md:flex"
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
      >
        <div className="flex h-16 items-center border-b border-slate-800 px-4">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <span className="ml-2 text-xl font-bold">JOC Analytics</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <a
            href="/"
            className="flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Home className="mr-3 h-5 w-5" />
            <span>Home</span>
          </a>
          <a
            href="/companies"
            className="flex items-center bg-slate-800 px-4 py-2 text-slate-300 dark:bg-slate-700"
          >
            <Building className="mr-3 h-5 w-5" />
            <span>Company List</span>
          </a>
          <a
            href="/companies/add"
            className="flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <UserPlus className="mr-3 h-5 w-5" />
            <span>Add Company</span>
          </a>
          <a
            href="/logout"
            className="flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Log Out</span>
          </a>
        </nav>
      </motion.aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-semibold dark:text-white">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <motion.button
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a href="/companies/add" className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </a>
              </motion.button>
              <motion.div
                whileHover={{ rotate: 10 }}
                whileTap={{ rotate: -10 }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-500 text-white">
                    A
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </div>
          </div>
        </header>
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
