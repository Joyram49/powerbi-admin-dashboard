import React from "react";

import ReportMetrics from "./_components/report-metrics/report-metrics";
import { SuperAdminLayoutWrapper } from "./_components/SuperAdminLayoutWrapper";
import SuperAdminTabs from "./_components/SuperAdminTab";

function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SuperAdminLayoutWrapper>
        <SuperAdminTabs />
        <ReportMetrics />
      </SuperAdminLayoutWrapper>
      {children}
    </>
  );
}

export default SuperAdminLayout;
