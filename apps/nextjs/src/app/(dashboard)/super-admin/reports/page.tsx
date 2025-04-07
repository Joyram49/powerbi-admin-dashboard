"use client";

import React, { useState } from "react";
import { skipToken } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { ReportsDataTable } from "../../_components/report-data-table";
import ReportForm from "../../_components/ReportFormModal";

const PAGE_SIZE = 10;

export default function ReportsPage() {
  const { data: userData } = api.auth.getProfile.useQuery();
  const userRole = userData?.user.user_metadata.role as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Get the appropriate query based on user role
  const reportsQuery = (() => {
    const queryInput = { limit: PAGE_SIZE, page, searched: search };

    if (userRole === "superAdmin") {
      return api.report.getAllReports.useQuery(queryInput);
    } else if (userRole === "admin") {
      return api.report.getAllReportsAdmin.useQuery(queryInput);
    } else {
      return api.report.getAllReportsUser.useQuery(queryInput);
    }
  })();

  const isLoading = reportsQuery.isLoading;
  const reports = reportsQuery.data;

  // Extract reports data based on the structure returned by your API
  const formattedData = reports?.data ?? [];
  const totalCount = reports?.total ?? 0;

  // Mutations
  const createReportMutation = api.report.create.useMutation({
    onSuccess: () => {
      toast.success("Report created successfully");
      void reportsQuery.refetch();
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create report");
    },
  });

  const updateReportMutation = api.report.updateReport.useMutation({
    onSuccess: () => {
      toast.success("Report updated successfully");
      handleCloseModal();
      void reportsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update report");
    },
  });

  const deleteReportMutation = api.report.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted successfully");
      void reportsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete report");
    },
  });

  // Report data for editing
  const reportToEditQuery = api.report.getReportById.useQuery(
    editingReportId ? { reportId: editingReportId } : skipToken,
  );

  // Handlers
  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleAddReport = () => {
    setEditingReportId(null);
    setFormOpen(true);
  };

  const handleEditReport = (reportId: string) => {
    setEditingReportId(reportId);
    setFormOpen(true);
  };

  const handleCloseModal = () => {
    setFormOpen(false);
    setEditingReportId(null);
  };

  const handleDeleteReport = (reportId: string) => {
    deleteReportMutation.mutate({ reportId });
  };

  const handleReportClick = (reportId: string) => {
    // Track access if needed here
    // For now, we'll just navigate to the report URL
    if (formattedData.length > 0) {
      const report = formattedData.find(
        (r) => (r.id || r.reportId) === reportId,
      );
      if (report?.reportUrl) {
        window.open(report.reportUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleSubmitReport = (formData: Record<string, unknown>) => {
    if (editingReportId) {
      updateReportMutation.mutate({
        reportId: editingReportId,
        ...formData,
      });
    } else {
      createReportMutation.mutate(formData as any);
    }
  };

  // Determine page title based on user role
  let pageTitle = "Reports";
  if (userRole === "superAdmin") {
    pageTitle = "All Reports";
  } else if (userRole === "admin") {
    pageTitle = "Company Reports";
  } else {
    pageTitle = "My Reports";
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">{pageTitle}</h1>

      <ReportsDataTable
        data={formattedData}
        userRole={userRole}
        isLoading={isLoading}
        onAddReport={handleAddReport}
        onEditReport={handleEditReport}
        onDeleteReport={handleDeleteReport}
        onReportClick={handleReportClick}
        onSearch={handleSearch}
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalItems={totalCount}
        onPageChange={handlePageChange}
      />

      {/* Add/Edit Report Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingReportId ? "Edit Report" : "Add New Report"}
            </DialogTitle>
          </DialogHeader>
          <ReportForm
            initialData={reportToEditQuery.data?.report}
            isLoading={
              reportToEditQuery.isLoading ||
              createReportMutation.isPending ||
              updateReportMutation.isPending
            }
            onSubmit={handleSubmitReport}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
