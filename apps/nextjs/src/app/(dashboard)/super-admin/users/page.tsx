import type { Metadata } from "next";

import { UsersDataTable } from "../_components/user-data-table";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage all system users",
};

export default function UsersPage() {
  return (
    <div className="container mx-auto py-10">
      <UsersDataTable />
    </div>
  );
}
