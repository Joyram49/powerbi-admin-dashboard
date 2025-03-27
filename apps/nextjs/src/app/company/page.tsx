import { AddCompanyForm } from "./_components/add-company-form";

function CompanyPage() {
  //   const companies = await api.company.getAllCompanies({ searched: "llc" });
  //   console.log(">>> companiese from company page", companies);
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Add New Company</h1>
      <div className="mx-auto max-w-md rounded-md border p-6 shadow-md">
        <AddCompanyForm />
      </div>
    </div>
  );
}

export default CompanyPage;
