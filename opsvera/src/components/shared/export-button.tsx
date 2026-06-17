"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/export-excel";

interface ExportButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  filename: string;
  sheetName?: string;
}

export function ExportButton({ data, filename, sheetName }: ExportButtonProps) {
  const handleExport = () => {
    exportToExcel(data, filename, sheetName);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="w-4 h-4 mr-2" />
      Export Excel
    </Button>
  );
}
