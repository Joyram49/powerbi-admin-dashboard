import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

export default function CompanySelector({
  selectedCompanyId,
  onCompanyChange,
  companies,
  isLoading,
}: {
  selectedCompanyId: string;
  onCompanyChange: (value: string) => void;
  companies: { id: string; companyName: string }[];
  isLoading: boolean;
}) {
  return (
    <div className="z-10 mb-4">
      <Select
        value={selectedCompanyId}
        onValueChange={onCompanyChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[250px] border-slate-200 dark:border-slate-800">
          <SelectValue placeholder={isLoading ? "Loading..." : "All Users"} />
        </SelectTrigger>
        <SelectContent className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <SelectItem
            value="all"
            className="mb-2 cursor-pointer hover:bg-slate-100 data-[state=checked]:bg-slate-600 dark:hover:bg-slate-700 dark:data-[state=checked]:bg-slate-600"
          >
            All Users
          </SelectItem>
          {companies.map((company) => (
            <SelectItem
              key={company.id}
              value={company.id}
              className="cursor-pointer hover:bg-slate-100 data-[state=checked]:bg-slate-600 dark:hover:bg-slate-700 dark:data-[state=checked]:bg-slate-600"
            >
              {company.companyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
