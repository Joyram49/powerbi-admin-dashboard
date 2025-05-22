import React from "react";

interface ChartWrapperProps {
  type: "bar" | "line" | "pie";
  data: any;
  options?: any;
  children?: React.ReactNode;
}

export function ChartWrapper({
  type,
  data,
  options,
  children,
}: ChartWrapperProps) {
  return (
    <div className="flex h-full w-full items-center justify-center text-gray-400">
      {children ? (
        children
      ) : (
        <span>
          {type.charAt(0).toUpperCase() + type.slice(1)} Chart Placeholder
        </span>
      )}
    </div>
  );
}
