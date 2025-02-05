import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NGINX Log Analyzer",
  description: "Analyze and visualize your NGINX logs with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
