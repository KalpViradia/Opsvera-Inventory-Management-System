import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Opsvera — Enterprise Inventory & ERP Platform",
  description:
    "Configurable enterprise operations platform for multi-tenant inventory, procurement, sales, and accounting.",
  keywords: [
    "ERP",
    "inventory management",
    "procurement",
    "sales",
    "accounting",
    "enterprise",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/branding/favicons/favicon-16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/branding/favicons/favicon-32.svg", sizes: "32x32", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/branding/app-icons/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://opsvera.com",
    title: "Opsvera — Enterprise Operations Platform",
    description: "Configurable enterprise operations platform for multi-tenant inventory, procurement, sales, and accounting.",
    siteName: "Opsvera",
    images: [
      {
        url: "/branding/og/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Opsvera Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans overflow-hidden">
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
