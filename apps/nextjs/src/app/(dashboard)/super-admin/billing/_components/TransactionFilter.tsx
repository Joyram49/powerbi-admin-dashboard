import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

interface TransactionFilterProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function TransactionFilter({
  options,
  value,
  onChange,
}: TransactionFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="border-gray-200 dark:border-gray-700">
        <SelectValue placeholder="Filter" />
      </SelectTrigger>
      <SelectContent className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {options.map((opt) => (
          <SelectItem 
            key={opt.value} 
            value={opt.value}
            className="focus:bg-gray-100 dark:focus:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
