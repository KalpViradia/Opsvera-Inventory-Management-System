"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Detects rapid keyboard input (typical of USB/Bluetooth barcode scanners).
 * Barcode scanners inject characters very quickly (< 50ms between keystrokes)
 * and usually end with an Enter key press.
 *
 * @param onScan - Callback fired with the full barcode string when a scan is detected.
 * @param options - Optional configuration.
 */
interface UseBarcodeOptions {
  /** Max time (ms) between characters to be considered a scan. Default: 50 */
  maxDelay?: number;
  /** Minimum length of a valid barcode string. Default: 4 */
  minLength?: number;
  /** If true, the hook is active. Default: true */
  enabled?: boolean;
}

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: UseBarcodeOptions = {}
) {
  const { maxDelay = 50, minLength = 4, enabled = true } = options;
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing into an input/textarea (unless it's our dedicated barcode field)
      const target = e.target as HTMLElement;
      const isBarcodeFocused = target.getAttribute("data-barcode-input") === "true";
      const isInputField = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";

      if (isInputField && !isBarcodeFocused) return;

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      if (timeSinceLastKey > maxDelay && bufferRef.current.length > 0) {
        // Too slow — reset buffer (user is typing normally)
        bufferRef.current = "";
      }

      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          const scannedValue = bufferRef.current.trim();
          setLastScanned(scannedValue);
          onScan(scannedValue);
          e.preventDefault();
        }
        bufferRef.current = "";
        return;
      }

      // Only accept printable single-char keys
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    },
    [onScan, maxDelay, minLength]
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);

  return { lastScanned };
}
