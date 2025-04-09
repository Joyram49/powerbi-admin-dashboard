"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function SuperAdminTabs() {
  const pathName = usePathname();

  return (
    <div className="w-full p-6">
      <div className="flex w-fit max-w-72 items-center justify-center gap-x-2 rounded border-[1px] border-slate-50/10 bg-slate-300 px-3 py-2 text-sm dark:bg-slate-900">
        <Link
          className={`cursor-pointer rounded-sm px-2 py-1 ${pathName === "/super-admin" ? "bg-blue-500 text-white" : "bg-white dark:bg-slate-800"}`}
          href={"/super-admin"}
        >
          <span>Company</span>
        </Link>
        <Link
          className={`cursor-pointer rounded-sm px-2 py-1 ${pathName === "/super-admin/users" ? "bg-blue-500 text-white" : "bg-white dark:bg-slate-800"}`}
          href={"/super-admin/users"}
        >
          <span>Users</span>
        </Link>
        <Link
          className={`cursor-pointer rounded-sm px-2 py-1 ${pathName === "/super-admin/reports" ? "bg-blue-500 text-white" : "bg-white dark:bg-slate-800"}`}
          href={"/super-admin/reports"}
        >
          <span>Reports</span>
        </Link>
      </div>
    </div>
  );
}

export default SuperAdminTabs;
