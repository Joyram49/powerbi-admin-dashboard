"use client";

import { motion } from "framer-motion";

import { UsersDataTable } from "../super-admin/users/_components/user-data-table";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdminDashboard() {
  return (
    <motion.main
      className="flex-1 overflow-y-auto p-6"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <UsersDataTable />
    </motion.main>
  );
}
