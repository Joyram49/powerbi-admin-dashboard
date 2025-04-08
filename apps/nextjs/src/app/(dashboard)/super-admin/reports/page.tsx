"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DeleteReportDialog } from "../../_components/DeleteReportDialog";
import { ReportsDataTable } from "../../_components/report-data-table";
import { ReportModal } from "../../_components/ReportFormModal";

export default function ReportsPage() {
  const { data } = api.auth.getProfile.useQuery();
  const userRole = data?.user.user_metadata.role as string;

  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const debouncedSearch = useDebounce(searchTerm, 500);
  // Fetch reports based on user role
  const reportsQuery =
    userRole === "superAdmin"
      ? api.report.getAllReports.useQuery({
          searched: debouncedSearch,
          page,
          limit,
        })
      : userRole === "admin"
        ? api.report.getAllReportsAdmin.useQuery({
            searched: debouncedSearch,
            page,
            limit,
          })
        : api.report.getAllReportsUser.useQuery({
            searched: debouncedSearch,
            page,
            limit,
          });

  const { mutate: deleteReport } = api.report.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Delete successful", {
        description: "Report deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      reportsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleSearch = (e: any) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenReportModal = (report = null) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const handleOpenDeleteDialog = (report) => {
    setSelectedReport(report);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteReport = () => {
    if (selectedReport) {
      deleteReport({ reportId: selectedReport.id });
    }
  };

  const handleReportModalClose = (shouldRefetch = false) => {
    setIsReportModalOpen(false);
    setSelectedReport(null);
    if (shouldRefetch) {
      reportsQuery.refetch();
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        {userRole === "superAdmin" && (
          <Button
            onClick={() => handleOpenReportModal()}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Report
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search reports..."
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-sm"
          type="search"
        />
      </div>

      <ReportsDataTable
        data={reportsQuery.data?.data || reportsQuery.data?.reports || []}
        isLoading={reportsQuery.isLoading}
        userRole={userRole}
        onEdit={handleOpenReportModal}
        onDelete={handleOpenDeleteDialog}
        totalItems={reportsQuery.data?.total || 0}
        pageCount={Math.ceil((reportsQuery.data?.total || 0) / limit)}
        currentPage={page}
      />

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={handleReportModalClose}
          report={selectedReport}
          userRole={userRole}
        />
      )}

      {isDeleteDialogOpen && (
        <DeleteReportDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDelete={handleDeleteReport}
          reportName={selectedReport?.reportName || ""}
        />
      )}
    </div>
  );
}
