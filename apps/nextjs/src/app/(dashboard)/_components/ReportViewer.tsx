import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";

import type { ReportType } from "../super-admin/reports/_components/ReportForm";

interface ReportViewerProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportType | null;
}

// Report Viewer Component

export default function ReportViewer({
  isOpen,
  onClose,
  report,
}: ReportViewerProps) {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-11/12 max-w-6xl overflow-hidden bg-white p-0 dark:bg-slate-900">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {report.reportName}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="h-[80vh] overflow-auto bg-white dark:bg-slate-900">
          <iframe
            src={report.reportUrl}
            className="h-full w-full border-0 bg-white dark:bg-slate-900"
            title={report.reportName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
