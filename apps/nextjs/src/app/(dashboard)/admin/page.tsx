"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { api } from "~/trpc/react";
import { UsersDataTable } from "../_components/user-data-table";
import ReportsPage from "../super-admin/reports/page";

// Dummy data function for reports
const getReports = () => {
  return [
    {
      id: 1,
      name: "Sample demo report",
      createdBy: "Admin",
      createdDate: "2025-03-10",
      users: 8,
      active: true,
    },
    {
      id: 2,
      name: "Monthly sales report",
      createdBy: "Admin",
      createdDate: "2025-03-05",
      users: 5,
      active: true,
    },
    {
      id: 3,
      name: "User activity log",
      createdBy: "System",
      createdDate: "2025-02-28",
      users: 3,
      active: false,
    },
    {
      id: 4,
      name: "Quarterly performance",
      createdBy: "Admin",
      createdDate: "2025-01-15",
      users: 10,
      active: true,
    },
  ];
};

// Animation variants
const rowVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdminDashboard() {
  const { data } = api.auth.getProfile.useQuery();
  const userRole = data?.user.user_metadata.role as string;

  return (
    <motion.main
      className="flex-1 overflow-y-auto p-6"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <UsersDataTable userRole={userRole} />
    </motion.main>
  );
}
