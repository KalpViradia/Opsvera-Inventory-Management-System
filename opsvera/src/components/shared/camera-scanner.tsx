"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We mount the scanner on a div with id "reader"
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 150 }, // typical barcode aspect ratio
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // Stop scanning after a successful read
        scanner.clear().catch(console.error);
        onScan(decodedText);
      },
      () => {
        // We don't usually want to do anything on read failure (happens 10x a sec)
        // console.log("Scan failed: ", err);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("Failed to clear scanner", err));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <style dangerouslySetInnerHTML={{__html: `
        #reader button {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          margin-top: 1rem;
          cursor: pointer;
        }
        #reader a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
      `}} />
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4">Scan Barcode</h3>
        
        {/* The scanner library requires an element with this exact ID */}
        <div id="reader" className="w-full min-h-[300px] overflow-hidden rounded-lg bg-black"></div>
        
        {error && <p className="text-sm text-destructive mt-4">{error}</p>}

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
