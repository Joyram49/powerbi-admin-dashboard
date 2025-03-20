"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Avatar, AvatarFallback } from "@acme/ui/avatar";
import { ThemeToggle } from "@acme/ui/theme";

import RoleSwitcher from "../../_components/RoleSwitcher";
import Sidebar from "../../_components/Sidebar";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  // Handle role change
  const handleRoleChange = useCallback(
    (newRole: string | undefined) => {
      if (newRole === userRole) return; // Prevent unnecessary updates

      setUserRole(newRole);
      document.cookie = `role=${newRole};path=/`;
    },
    [userRole], // Only re-run if `userRole` changes
  );

  // Load role from cookies
  useEffect(() => {
    const cookies = document.cookie.split(";");
    const roleCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("role="),
    );
    const savedRole = roleCookie ? roleCookie.split("=")[1] : "USER";

    setUserRole(savedRole); // Set state, but don't trigger navigation yet
  }, []); // Empty dependency array ensures this runs only on mount

  // Redirect based on role AFTER state update
  useEffect(() => {
    if (!userRole) return; // Prevent running on first render

    switch (userRole) {
      case "SUPER_ADMIN":
        router.push("/dashboard/super-admin");
        break;
      case "ADMIN":
        router.push("/dashboard/admin");
        break;
      case "USER":
      default:
        router.push("/dashboard/user");
        break;
    }
  }, [userRole, router]); // Runs only when `userRole` changes

  return (
    <>
      <RoleSwitcher onRoleChange={handleRoleChange} />
      <div className="flex h-screen bg-gray-100 dark:bg-slate-950">
        {/* Sidebar */}
        <Sidebar userRole={userRole} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex h-16 items-center justify-between px-6">
              <h1 className="text-xl font-semibold dark:text-white">
                Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                {/* Only show Add Company button for super_admin */}
                {userRole === "SUPER_ADMIN" && (
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
                {userRole === "ADMIN" && (
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
    </>
  );
}
