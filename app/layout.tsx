import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Discord Server",
  description: "Join our awesome Discord community",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}