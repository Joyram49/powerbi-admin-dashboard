interface Admin {
  id: string;
  userName: string;
  email: string;
  phone: string;
  companyAdminId: string;
}

interface Company {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  dateJoined: string;
  status: "active" | "inactive" | "suspended" | "pending";
  lastActivity: string | null;
  modifiedBy: string;
  employeeCount: number;
  reportCount: number;
  admin: Admin;
  sorting?: {
    sortBy: "companyName" | "dateJoined";
    onSortChange: (value: "companyName" | "dateJoined") => void;
  };
}
interface User {
  id: string;
  email: string;
  userName: string;
  role: "user" | "admin" | "superAdmin";
  status: "active" | "inactive" | null;
  dateCreated: Date;

  companyId: string | null;
  modifiedBy: string | null;
  lastLogin: string | number | Date;
  company?: { companyName: string };
}
interface UserData {
  success: boolean;
  message: string;
  total: number;
  limit: number;
  page: number;
  data: User[];
}
