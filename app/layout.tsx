import type { Metadata } from "next";
import { Space_Grotesk, Source_Code_Pro } from "next/font/google";

import { AppHeader } from "@/components/app-header";

import "./globals.css";

const sans = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const mono = Source_Code_Pro({
  variable: "--font-source-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube History Record Tracker",
  description: "Detect history-made and record-breaking events from YouTube transcripts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(33,128,141,0.13),transparent_55%)]">
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
