"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BrandingProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Renders the full Opsvera Logo (Mark + Wordmark)
 * Automatically switches between light and dark mode variants based on next-themes.
 */
export function Logo({ className, width = 120, height = 30 }: BrandingProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by rendering a placeholder until theme is known
  if (!mounted) {
    return <div style={{ width, height }} className={cn("animate-pulse bg-muted rounded", className)} />;
  }

  const src =
    resolvedTheme === "dark"
      ? "/branding/logos/logo-dark.svg"
      : "/branding/logos/logo-light.svg";

  return (
    <Image
      src={src}
      alt="Opsvera Logo"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  );
}

/**
 * Renders the Opsvera Mark (Hexagon Icon only)
 * Automatically switches between light and dark mode variants based on next-themes.
 */
export function Mark({ className, width = 32, height = 32 }: BrandingProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width, height }} className={cn("animate-pulse bg-muted rounded-lg", className)} />;
  }

  const src =
    resolvedTheme === "dark"
      ? "/branding/marks/mark-dark.svg"
      : "/branding/marks/mark-light.svg";

  return (
    <Image
      src={src}
      alt="Opsvera Mark"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  );
}
