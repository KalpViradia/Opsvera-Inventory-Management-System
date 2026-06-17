"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import InvoicePDFTemplate, { type InvoiceTemplateData } from "./invoice-pdf-template";
import { getPurchaseInvoiceForPDF, getSalesInvoiceForPDF } from "@/actions/invoice-data";

interface DownloadInvoiceButtonProps {
  invoiceId: string;
  type: "purchase" | "sales";
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadInvoiceButton({
  invoiceId,
  type,
  className,
  variant = "outline",
  size = "sm",
}: DownloadInvoiceButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      let data: InvoiceTemplateData;

      if (type === "purchase") {
        const result = await getPurchaseInvoiceForPDF(invoiceId);
        
        // Calculate subtotal
        const subtotal = result.invoice.po.items.reduce((acc, item) => 
          acc + Number(item.quantity) * Number(item.unitPrice), 0);

        data = {
          title: "PURCHASE INVOICE",
          invoiceNumber: result.invoice.invoiceNumber,
          date: result.invoice.createdAt.toISOString().split("T")[0],
          dueDate: result.invoice.dueDate?.toISOString().split("T")[0],
          companyName: result.company?.name || "Opsvera",
          companyCurrency: result.company?.currency || "USD",
          partyName: result.invoice.supplier.name,
          partyAddress: result.invoice.supplier.address || "",
          items: result.invoice.po.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            total: Number(item.quantity) * Number(item.unitPrice),
          })),
          subtotal,
          taxAmount: Number(result.invoice.taxAmount),
          total: Number(result.invoice.amount),
        };
      } else {
        const result = await getSalesInvoiceForPDF(invoiceId);
        
        // Calculate subtotal
        const subtotal = result.invoice.so.items.reduce((acc, item) => 
          acc + Number(item.quantity) * Number(item.unitPrice), 0);
          
        data = {
          title: "SALES INVOICE",
          invoiceNumber: result.invoice.invoiceNumber,
          date: result.invoice.createdAt.toISOString().split("T")[0],
          dueDate: result.invoice.dueDate?.toISOString().split("T")[0],
          companyName: result.company?.name || "Opsvera",
          companyCurrency: result.company?.currency || "USD",
          partyName: result.invoice.customer.name,
          partyAddress: result.invoice.customer.address || "",
          items: result.invoice.so.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            total: Number(item.quantity) * Number(item.unitPrice),
          })),
          subtotal,
          taxAmount: Number(result.invoice.taxAmount),
          discount: Number(result.invoice.so.discount || 0),
          total: Number(result.invoice.amount),
        };
      }

      // Generate PDF Blob
      const blob = await pdf(<InvoicePDFTemplate data={data} />).toBlob();
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${data.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Invoice PDF generated");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={isGenerating}
      title="Download PDF"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {size !== "icon" && <span className="ml-2">Download PDF</span>}
    </Button>
  );
}
