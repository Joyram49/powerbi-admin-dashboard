import React from "react";

export default function ManageBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Manage Billing
        </h1>
        {children}
      </div>
    </div>
  );
}
