"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FileText, Search } from "lucide-react";

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
   
// Dummy data function for user reports
const getUserReports = () => {
  return [
    {
      id: 1,
      name: "Sample demo report",
      lastAccessed: "2025-03-18",
      status: "Available",
    },
  ];
};

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const rowVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export default function UserDashboard() {
  const reports = getUserReports();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter reports
  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = filteredReports.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Page navigation handlers
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
          Available Reports
        </h2>
        <Card className="mt-4 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">Reports</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search reports..."
                  className="pl-8 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
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
                    Last Accessed
                  </TableHead>
                  <TableHead className="dark:text-slate-300">Status</TableHead>
                  <TableHead className="dark:text-slate-300">Action</TableHead>
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
                    <TableCell>{report.lastAccessed}</TableCell>
                    <TableCell>{report.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Report
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
                {filteredReports.length === 0 && (
                  <TableRow className="dark:border-slate-700 dark:bg-slate-800">
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-slate-500 dark:text-slate-400"
                    >
                      No reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {filteredReports.length > 0 && totalPages > 1 && (
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
