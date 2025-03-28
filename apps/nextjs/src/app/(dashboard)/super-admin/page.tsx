"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

// Dummy data function for companies
const getCompanies = () => {
  return [
    {
      id: 1,
      name: "Acme Corporation",
      admin: "John Doe",
      users: 24,
      createdDate: "2025-01-15",
      active: true,
    },
    {
      id: 2,
      name: "Wayne Enterprises",
      admin: "John Smith",
      users: 18,
      createdDate: "2025-02-10",
      active: true,
    },
    {
      id: 3,
      name: "Stark Industries",
      admin: "Sara Johnson",
      users: 32,
      createdDate: "2025-02-20",
      active: true,
    },
    {
      id: 4,
      name: "Umbrella Corp",
      admin: "Jessica White",
      users: 16,
      createdDate: "2025-03-05",
      active: false,
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

export default function SuperAdminDashboard() {
  const allCompanies = getCompanies();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Search filter
  const filteredCompanies = allCompanies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCompanies = filteredCompanies.slice(
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
          Company Management
        </h2>
        <Card className="mt-4 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">Companies</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search companies..."
                    className="pl-8 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700 dark:bg-slate-800">
                  <TableHead className="dark:text-slate-300">
                    Company Name
                  </TableHead>
                  <TableHead className="dark:text-slate-300">Admin</TableHead>
                  <TableHead className="dark:text-slate-300">
                    Date Created
                  </TableHead>
                  <TableHead className="text-center dark:text-slate-300">
                    Users
                  </TableHead>
                  <TableHead className="text-center dark:text-slate-300">
                    Status
                  </TableHead>
                  <TableHead className="text-right dark:text-slate-300">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCompanies.map((company, index) => (
                  <motion.tr
                    key={company.id}
                    initial="hidden"
                    animate="visible"
                    variants={rowVariants}
                    transition={{ delay: index * 0.1 }}
                    className="dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <TableCell className="font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between"
                          >
                            {company.name}
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>User List</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>{company.admin}</TableCell>
                    <TableCell>{company.createdDate}</TableCell>
                    <TableCell className="text-center">
                      <Link
                        href={`/dashboard/super-admin/companies/${company.id}/users`}
                      >
                        <Badge className="bg-blue-50 dark:bg-blue-900 dark:text-blue-100">
                          {company.users}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          company.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                        }
                      >
                        {company.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/super-admin/companies/${company.id}/reports`}
                        className="flex items-center justify-center text-nowrap rounded-md border border-slate-200 px-2 py-1 text-sm font-medium dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                      >
                        <Building className="mr-2 h-4 w-4" />
                        View Reports
                      </Link>
                    </TableCell>
                  </motion.tr>
                ))}
                {filteredCompanies.length === 0 && (
                  <TableRow className="dark:border-slate-700 dark:bg-slate-800">
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-slate-500 dark:text-slate-400"
                    >
                      No companies found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {filteredCompanies.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredCompanies.length)} of{" "}
                {filteredCompanies.length} companies
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
