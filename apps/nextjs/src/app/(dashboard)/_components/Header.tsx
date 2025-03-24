"use client";


import Link from "next/link";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Avatar, AvatarFallback } from "@acme/ui/avatar";
import { ThemeToggle } from "@acme/ui/theme";

export default function Header({ userRole }: { userRole: string | undefined }) {

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-xl font-semibold dark:text-white">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {/* Only show Add Company button for super_admin */}
          {userRole === "superAdmin" && (
            <motion.button
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/dashboard/super-admin/companies/add"
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Link>
            </motion.button>
          )}
          {/* Only show Add User button for admin */}
          {userRole === "admin" && (
            <motion.button
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/dashboard/admin/users/add"
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </motion.button>
          )}
          <motion.div whileHover={{ rotate: 10 }} whileTap={{ rotate: -10 }}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white">
                A
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
