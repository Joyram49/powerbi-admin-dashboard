"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items",
  className,
  loading = false,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const getLabel = (value: string): string => {
    return options.find((option) => option.value === value)?.label ?? value;
  };

  // Filter options to only show unselected items in the dropdown
  const availableOptions = options.filter(
    (option) => !selected.includes(option.value),
  );

  return (
    <div className="space-y-4">
      {/* Selected items list */}
      <div className="mt-2 space-y-2">
        {selected.length > 0 &&
          selected.map((value) => (
            <div
              key={value}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800"
            >
              <span className="font-medium dark:text-white">
                {getLabel(value)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(value)}
                className="h-7 w-7 rounded-full p-0 hover:bg-red-300/60 dark:hover:bg-red-800/40"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        {selected.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            No items selected
          </div>
        )}
      </div>

      {/* Selection dropdown */}
      <div className="pt-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between border border-input bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white",
                className,
              )}
              disabled={disabled}
            >
              <span className="text-muted-foreground dark:text-gray-400">
                {placeholder}
              </span>
              {loading ? (
                <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full min-w-[200px] border p-0 dark:border-gray-700 dark:bg-gray-800"
            align="start"
          >
            <Command className="dark:bg-gray-800">
              <CommandInput
                placeholder="Search..."
                className="dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
              />
              <CommandList className="dark:bg-gray-800">
                <CommandEmpty className="dark:text-gray-400">
                  No results found.
                </CommandEmpty>
                <CommandGroup className="dark:bg-gray-800">
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground dark:text-gray-400" />
                    </div>
                  ) : (
                    availableOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        onSelect={() => handleSelect(option.value)}
                        className="cursor-pointer dark:bg-gray-900 dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-medium">{option.label}</span>
                          <Check className="h-4 w-4 text-primary opacity-0 dark:text-blue-400" />
                        </div>
                      </CommandItem>
                    ))
                  )}
                  {availableOptions.length === 0 && !loading && (
                    <div className="px-2 py-4 text-center text-sm dark:text-gray-400">
                      No more items available to add.
                    </div>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
