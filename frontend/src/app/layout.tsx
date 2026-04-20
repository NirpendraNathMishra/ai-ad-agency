import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AdForge AI — AI-Powered Ad Agency | Autonomous Campaign Automation",
  description:
    "End-to-end AI advertising platform. From strategy to execution — automate your Google Ads, Meta Ads & DV360 campaigns with MCP-powered intelligence.",
  keywords: [
    "AI advertising",
    "ad automation",
    "Google Ads",
    "Meta Ads",
    "DV360",
    "MCP",
    "campaign optimization",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased bg-black text-white overflow-x-hidden`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
