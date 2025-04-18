import ActiveAccountsCard from "./active-accounts";
import TotalReportsCard from "./total-reports-card";
import UserEngagementCard from "./user-engagement";

function ReportMetrics() {
  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card md:grid-cols-2 lg:px-6 xl:grid-cols-4">
      {/* <TotalUsersCard /> */}
      {/* <TotalReportsCard />
      <ActiveAccountsCard />
      <UserEngagementCard /> */}
    </div>
  );
}

export default ReportMetrics;
