import React from "react";

import SuperAdminTabs from "./_components/super-admin-tab";
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
