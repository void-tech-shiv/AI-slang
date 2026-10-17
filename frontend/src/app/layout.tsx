import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Slang — Translate like locals talk",
  description: "Natural Indian slang translation that preserves tone and emotion.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
