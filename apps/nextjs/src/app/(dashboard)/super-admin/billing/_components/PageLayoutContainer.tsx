import React from "react";

export function PageLayoutContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto grid max-w-7xl auto-rows-min grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </div>
  );
}
