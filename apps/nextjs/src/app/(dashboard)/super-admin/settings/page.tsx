"use client";

import { api } from "~/trpc/react";

export default function SettingsPage() {
  const {
    data: billings,
    isLoading,
    isError,
    error,
  } = api.billing.getAllBillings.useQuery(
    {
      limit: 10,
      page: 1,
      sortBy: "new_to_old_billing",
      filters: {
        status: "paid",
        minAmount: 500,
        maxAmount: 1000,
      },
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  console.log(billings);

  return (
    <div>
      <h1>Settings</h1>
      <pre>{JSON.stringify(billings, null, 2)}</pre>
    </div>
  );
}
