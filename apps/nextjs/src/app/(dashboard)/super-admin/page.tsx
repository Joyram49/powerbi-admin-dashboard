import { api } from "~/trpc/server";
import { columns } from "./_components/company-columns";
import { DataTable } from "./_components/company-data-table";

async function SuperDashboard() {
  const companies = await api.company.getAllCompanies({
    searched: "",
    sortBy: "companyName",
  });
  return (
    <div className="container mx-auto w-full p-6">
      <DataTable columns={columns} data={companies.data} />
    </div>
  );
}

export default SuperDashboard;
