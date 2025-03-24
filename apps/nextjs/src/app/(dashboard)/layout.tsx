"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "./_components/Header";
import RoleSwitcher from "./_components/RoleSwitcher";
import Sidebar from "./_components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      case "superAdmin":
        router.push("/super-admin");
        break;
      case "admin":
        router.push("/admin");
        break;
      case "user":
      default:
        router.push("/user");
        break;
    }
  }, [userRole, router]);
  return (
    <div>
      <RoleSwitcher onRoleChange={handleRoleChange} />
      <div className="flex h-screen bg-gray-100 dark:bg-slate-950">
        {/* Sidebar */}
        <Sidebar userRole={userRole} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header userRole={userRole} />
          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
