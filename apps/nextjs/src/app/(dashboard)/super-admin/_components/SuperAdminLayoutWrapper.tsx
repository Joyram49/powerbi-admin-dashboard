"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface SuperAdminLayoutWrapperProps {
  children: React.ReactNode;
}

export function SuperAdminLayoutWrapper({
  children,
}: SuperAdminLayoutWrapperProps) {
  const pathname = usePathname();
  const isBillingPage = pathname.includes("billing");

  // If it's a billing page, only render the children (billing page content)
  if (isBillingPage) {
    return;
  }

  // For non-billing pages, render all components including tabs and metrics
  return <div>{children}</div>;
}
