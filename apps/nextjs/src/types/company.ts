export interface Company {
  id: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  dateJoined: Date | null;
  status: "active" | "inactive" | "suspended" | "pending" | null;
  lastActivity: Date | null;
  modifiedBy: string | null;
  employeeCount: number;
  reportCount: number;
  admin: {
    id: string;
    userName: string;
    email: string;
    phone?: string;
    companyAdminId?: string;
  };
}
