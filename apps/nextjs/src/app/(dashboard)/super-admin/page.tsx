import { api } from "~/trpc/server";
import { columns } from "./_components/company-columns";
import { DataTable } from "./_components/company-data-table";

async function SuperDashboard() {
  const { data: companies } = await api.company.getAllCompanies({
    searched: "",
    sortBy: "companyName",
  });
  console.log(companies);
  return (
    <div className="container mx-auto w-full p-6">
      <DataTable columns={columns} data={companies} />
    </div>
  );
}

export default SuperDashboard;
