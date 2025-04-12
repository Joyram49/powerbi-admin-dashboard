"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useDebounce } from "~/hooks/useDebounce";
import { api } from "~/trpc/react";
import { DeleteReportDialog } from "./_components/DeleteReportDialog";
import { ReportsDataTable } from "./_components/report-data-table";
import { ReportModal } from "./_components/ReportFormModal";

// Define report type based on your Drizzle schema
interface Report {
  id: string;
  reportName: string;
  reportUrl: string;
  accessCount: number | null;
  dateCreated: Date | null;
  status: "active" | "inactive" | null;
  lastModifiedAt: Date | null;
  company: {
    id: string;
    companyName: string;
  } | null;
  userCount?: number;
}

type UserRole = "superAdmin" | "admin" | "user";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data } = api.auth.getProfile.useQuery();
  const userRole = data?.user.user_metadata.role as UserRole;

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { mutate: deleteReport } = api.report.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Delete successful", {
        description: "Report deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenReportModal = (report: Report | null = null) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const handleOpenDeleteDialog = (report: Report) => {
    setSelectedReport(report);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteReport = () => {
    if (selectedReport) {
      deleteReport({ reportId: selectedReport.id });
    }
  };

  const handleReportModalClose = () => {
    setIsReportModalOpen(false);
    setSelectedReport(null);
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
        userRole={userRole}
        onEdit={handleOpenReportModal}
        onDelete={handleOpenDeleteDialog}
        searchQuery={debouncedSearch}
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
          reportName={selectedReport?.reportName ?? ""}
        />
      )}
    </div>
  );
}
