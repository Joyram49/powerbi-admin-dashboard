"use client";

import { PanelLeft } from "lucide-react";

import { useSidebar } from "@acme/ui/sidebar";

export function CustomTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="rounded-md p-2 py-1 transition duration-100 hover:bg-slate-100 dark:hover:bg-slate-600"
    >
      <PanelLeft className="h-6 w-6" />
    </button>
  );
}
