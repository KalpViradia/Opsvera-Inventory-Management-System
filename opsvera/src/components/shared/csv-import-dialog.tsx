"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileType, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { parseCSV } from "@/lib/csv";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ImportResult } from "@/actions/import";

interface CSVImportDialogProps {
  importAction: (csvString: string) => Promise<ImportResult>;
  title?: string;
  description?: string;
  templateHeaders: string[];
}

export function CSVImportDialog({
  importAction,
  title = "Import CSV",
  description = "Upload a CSV file to import records.",
  templateHeaders,
}: CSVImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const router = useRouter();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        const hadSuccess = result && result.imported > 0;
        resetState();
        if (hadSuccess) {
          router.refresh();
        }
      }, 300); // reset after animation
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a valid CSV file");
      return;
    }

    setFile(selectedFile);
    
    // Parse preview
    const text = await selectedFile.text();
    const parsed = parseCSV(text);
    
    // Check if headers roughly match expectations
    const missingHeaders = templateHeaders.filter(
      th => !parsed.headers.some(ph => ph.toLowerCase().replace(/[^a-z]/g, '') === th.toLowerCase().replace(/[^a-z]/g, ''))
    );

    if (missingHeaders.length > 0) {
      toast.warning(`Missing expected headers: ${missingHeaders.join(", ")}`);
    }

    setPreview({
      headers: parsed.headers,
      rows: parsed.rows.slice(0, 5), // Preview first 5 rows
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const res = await importAction(text);
      setResult(res);
      
      if (res.errors.length === 0) {
        toast.success(`Successfully imported ${res.imported} records`);
      } else if (res.imported > 0) {
        toast.warning(`Imported ${res.imported} records, but encountered ${res.errors.length} errors`);
      } else {
        toast.error(`Failed to import. Found ${res.errors.length} errors.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvString = templateHeaders.join(",") + "\n";
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UploadCloud className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4">
          {!result ? (
            <>
              {/* Upload Zone */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${file ? 'border-primary/50 bg-primary/5' : 'border-muted hover:border-primary/50 hover:bg-accent/50'}
                `}
                onClick={() => !file && fileInputRef.current?.click()}
                style={{ cursor: file ? 'default' : 'pointer' }}
              >
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileType className="h-10 w-10 text-primary mb-2" />
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetState();
                      }}
                    >
                      <X className="mr-2 h-4 w-4" /> Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="font-medium text-foreground">Click or drag file to upload</p>
                    <p className="text-sm text-muted-foreground">Only .csv files are supported</p>
                    <Button variant="link" size="sm" className="mt-2" onClick={(e) => {
                      e.stopPropagation();
                      downloadTemplate();
                    }}>
                      Download Template
                    </Button>
                  </div>
                )}
              </div>

              {/* Data Preview */}
              {preview && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Data Preview</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground uppercase text-xs">
                        <tr>
                          {preview.headers.map((h, i) => (
                            <th key={i} className="px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.rows.map((row, i) => (
                          <tr key={i}>
                            {preview.headers.map((h, j) => (
                              <td key={j} className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate">
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    Showing first {preview.rows.length} rows
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Results View */
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex flex-col items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-700">{result.imported}</div>
                  <div className="text-sm text-green-600 font-medium">Successfully Imported</div>
                </div>
                
                {result.errors.length > 0 && (
                  <div className="flex-1 bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
                    <div className="text-2xl font-bold text-red-700">{result.errors.length}</div>
                    <div className="text-sm text-red-600 font-medium">Failed Rows</div>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-destructive flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" /> 
                    Error Details
                  </h3>
                  <ScrollArea className="h-[200px] border rounded-md p-4 bg-muted/50">
                    <div className="space-y-3">
                      {result.errors.map((err, i) => (
                        <div key={i} className="text-sm flex items-start gap-2">
                          <span className="bg-destructive/10 text-destructive font-mono px-1.5 py-0.5 rounded text-xs shrink-0">
                            Row {err.row}
                          </span>
                          <span className="text-muted-foreground">{err.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || isImporting}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isImporting ? "Importing..." : "Start Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
