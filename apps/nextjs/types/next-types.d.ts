interface Admin {
  id: string;
  userName: string;
}

type CompanyStatus = "active" | "inactive" | "suspended" | "pending";
interface Company {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  dateJoined: string;
  status: CompanyStatus;
  lastActivity: string | null;
  modifiedBy: string;
  employeeCount: number;
  reportCount: number;
  admin: Admin;
}
