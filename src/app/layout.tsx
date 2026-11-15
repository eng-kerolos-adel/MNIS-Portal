import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MNIS — National Unified Medical Identity System",
  description:
    "Clinical & hospital operations portal for the National Unified Medical Identity System (MNIS) — physician, pharmacy, laboratory, hospital and executive command workspaces.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1fbff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${inter.variable} ${cairo.variable}`}>
      <body className="antialiased bg-background text-on-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
