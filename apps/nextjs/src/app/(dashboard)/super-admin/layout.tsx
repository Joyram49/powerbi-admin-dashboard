import React from "react";

import ReportMetrics from "./_components/report-metrics/report-metrics";
import SuperAdminTabs from "./_components/SuperAdminTab";


function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SuperAdminTabs />
      <ReportMetrics />
      {children}
    </div>
  );
}

export default SuperAdminLayout;
