import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

// Inter carries the interface: it stays legible at the 11-14px sizes the
// dashboard, kiosk and wallet use for labels and figures.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Fraunces is the display face: a soft, high-contrast serif that reads as
// organic and premium, used for page titles and hero copy.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcoLoop Bangladesh — AI Recycling Reverse Vending Machine",
  description:
    "Scan waste, let the kiosk sort it, and earn BDT rewards on an EcoCard. A smart reverse vending machine for cleaner streets across Bangladesh.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
