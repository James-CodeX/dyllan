import type { Metadata } from "next";
import { Space_Grotesk, Source_Code_Pro } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

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
  title: "History Record",
  description: "Latest record-breaking events detected from YouTube transcripts.",
  icons: {
    icon: "/dylan-sticker.png",
    shortcut: "/dylan-sticker.png",
    apple: "/dylan-sticker.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="min-h-screen">{children}</div>
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="d93aef6b-5367-4efc-8695-c3c8a8a44df9"
        />
        <Analytics />
      </body>
    </html>
  );
}
