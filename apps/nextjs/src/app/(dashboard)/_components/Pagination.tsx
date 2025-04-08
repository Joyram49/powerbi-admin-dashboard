"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showSelectedRowsCount?: boolean;
  selectedRows?: number;
  filteredRows?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 40, 50],
  showPageSizeSelector = true,
  showSelectedRowsCount = false,
  selectedRows = 0,
  filteredRows = 0,
}: PaginationProps) {
  const handlePageSizeChange = (value: string) => {
    const newPageSize = Number(value);
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Items count */}
      {totalItems !== undefined && (
        <div className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{" "}
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
        </div>
      )}

      {/* Selected rows count - only shown when selected */}
      {showSelectedRowsCount && selectedRows > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedRows} of {filteredRows} row(s) selected.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Rows per page selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rows per page</span>
            <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Page indicator */}
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </div>

          {/* Navigation buttons group */}
          <div className="flex items-center gap-1">
            {/* Previous/Next buttons for larger screens */}
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-8 px-4"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-8 px-4"
              >
                Next
              </Button>
            </div>

            {/* Icon buttons for all screens */}
            <div className="flex items-center">
              <Button
                variant="outline"
                className="h-8 w-8 rounded-l p-0"
                onClick={() => onPageChange(1)}
                disabled={currentPage <= 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 border-l-0 p-0"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 border-l-0 p-0"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 rounded-r border-l-0 p-0"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
