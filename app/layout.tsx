import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CR7 AI API KEY PROVIDER SERVER",
  description: "Join CR7 AI API Key Provider Discord server – real AI API keys",
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
