import { AddReportForm } from "./_components/add-report-form";

function ReportPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Add New Report</h1>
      <div className="mx-auto max-w-md rounded-md border p-6 shadow-md">
        <AddReportForm />
      </div>
    </div>
  );
}

export default ReportPage;
