"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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

export default function CompanyListPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: companiesData,
    isLoading,
    error,
  } = api.company.getAllCompanies.useQuery({
    searched: searchTerm,
  });

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Companies</CardTitle>
          <Input
            placeholder="Search companies..."
            className="w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: "linear",
                }}
                className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent"
              />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              Error loading companies: {error.message}
            </div>
          ) : companiesData?.companies?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No companies found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companiesData?.companies?.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.companyName}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.phone || "N/A"}</TableCell>
                    <TableCell>{company.address || "N/A"}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
