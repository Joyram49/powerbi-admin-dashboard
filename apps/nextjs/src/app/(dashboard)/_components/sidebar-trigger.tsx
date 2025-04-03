"use client";

import { PanelLeftOpen } from "lucide-react";

import { useSidebar } from "@acme/ui/sidebar";

export function CustomTrigger() {
  const { toggleSidebar, open } = useSidebar();

  return (
    <button onClick={toggleSidebar} className={open ? "hidden" : "block"}>
      <PanelLeftOpen className="size-5" />
    </button>
  );
}
