import React from "react";

import { Button } from "@acme/ui/button";

interface DownloadButtonProps {
  onClick: () => void;
  label?: string;
}

export function DownloadButton({
  onClick,
  label = "Download",
}: DownloadButtonProps) {
  return (
    <Button onClick={onClick} size="sm" variant="default" className="text-white">
      {label}
    </Button>
  );
}
