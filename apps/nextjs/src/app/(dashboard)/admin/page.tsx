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
  const allReports = getReports();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Search filter
  const filteredReports = allReports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.createdBy.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = filteredReports.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Page change handlers
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <motion.main
      className="flex-1 overflow-y-auto p-6"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold dark:text-white">
          Report Management
        </h2>
        <Card className="mt-4 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">Reports</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search reports..."
                    className="pl-8 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                  />
                </div>
                <Button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  New Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700 dark:bg-slate-800">
                  <TableHead className="dark:text-slate-300">
                    Report Name
                  </TableHead>
                  <TableHead className="dark:text-slate-300">
                    Created By
                  </TableHead>
                  <TableHead className="dark:text-slate-300">
                    Date Created
                  </TableHead>
                  <TableHead className="text-center dark:text-slate-300">
                    Users
                  </TableHead>
                  <TableHead className="text-center dark:text-slate-300">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentReports.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    initial="hidden"
                    animate="visible"
                    variants={rowVariants}
                    transition={{ delay: index * 0.1 }}
                    className="dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{report.createdBy}</TableCell>
                    <TableCell>{report.createdDate}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-50 dark:bg-blue-900 dark:text-blue-100">
                        {report.users}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          report.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                        }
                      >
                        {report.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </motion.tr>
                ))}
                {filteredReports.length === 0 && (
                  <TableRow className="dark:border-slate-700 dark:bg-slate-800">
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-slate-500 dark:text-slate-400"
                    >
                      No reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {filteredReports.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredReports.length)} of{" "}
                {filteredReports.length} reports
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1">Previous</span>
                </Button>
                <div className="text-sm font-medium dark:text-white">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                >
                  <span className="mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </motion.main>
  );
}
