"use client";

import { useEffect, useState } from "react";

interface RoleSwitcherProps {
  onRoleChange?: (role: string) => void;
}

export default function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const [userRole, setUserRole] = useState<string | undefined>("USER");

  useEffect(() => {
    const cookies = document.cookie.split(";");
    const roleCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("role="),
    );
    const savedRole = roleCookie
      ? roleCookie.split("=")[1]
      : ("USER" as string);
    setUserRole(savedRole);
  }, []);

  const changeRole = (role: string) => {
    document.cookie = `role=${role};path=/`;
    setUserRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md bg-white p-2 shadow-lg dark:bg-slate-800">
      <select
        value={userRole}
        onChange={(e) => changeRole(e.target.value)}
        className="rounded border p-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      >
        <option value="SUPER_ADMIN">Super Admin</option>
        <option value="ADMIN">Admin</option>
        <option value="USER">User</option>
      </select>
    </div>
  );
}
