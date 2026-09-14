import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "@/config/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Editorial headline serif, per the brand brief's typography direction
// (serif headlines, sans body/interface) — body copy stays on Geist Sans.
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brandisby",
  description: "Discover the brands shaping Nigeria.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
