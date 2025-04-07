"use client";

import { api } from "~/trpc/react";
import { UsersDataTable } from "../../_components/user-data-table";

export default function UsersPage() {
  const { data } = api.auth.getProfile.useQuery();
  const userRole = data?.user.user_metadata.role as string;

  return (
    <div className="container mx-auto py-10">
      <UsersDataTable userRole={userRole} />
    </div>
  );
}
