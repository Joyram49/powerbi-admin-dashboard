import React from "react";

import SuperAdminTabs from "./_components/SuperAdminTab";
import ReportMetrics from "./_components/report-metrics/report-metrics";


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
