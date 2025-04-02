import { api } from "~/trpc/server";

async function SuperDashboard() {
  const companies = await api.company.getAllCompanies();
  console.log(companies);
  return <div>Super admin dashboard</div>;
}

export default SuperDashboard;
