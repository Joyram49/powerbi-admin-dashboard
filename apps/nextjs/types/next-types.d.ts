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
  userId: string;
  id: string;
  email: string;
  userName: string;
  role: "user" | "admin" | "superAdmin";
  status: "active" | "inactive" | undefined;
  dateCreated: Date;

  companyId: string | undefined;
  modifiedBy: string | null;
  lastLogin: string | number | Date | null | undefined;
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
