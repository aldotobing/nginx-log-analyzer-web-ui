import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Log Analyzer - Analyze & Visualize Nginx and Apache Logs",
  description:
    "Analyze and visualize your Nginx and Apache HTTPD logs with ease. Gain insights into server performance and web traffic with Log Analyzer.",
  generator: "Aldo Tobing",
  keywords: [
    "Log Analyzer",
    "Nginx logs",
    "Apache logs",
    "Server performance",
    "Traffic analysis",
    "Server monitoring",
  ],
  applicationName: "Log Analyzer",
  openGraph: {
    title: "Log Analyzer - Analyze & Visualize Nginx and Apache Logs",
    description:
      "Analyze your Nginx and Apache HTTPD logs with powerful insights into your server’s traffic and performance.",
    url: "https://nginx.aldotobing.online",
    siteName: "Log Analyzer",
    images: [
      {
        url: "https://nginx.aldotobing.online/assets/img/analyze.jpg",
        width: 1200,
        height: 630,
        alt: "Log Analyzer Dashboard",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Log Analyzer - Analyze & Visualize Nginx and Apache Logs",
    description:
      "Analyze your Nginx and Apache HTTPD logs with powerful insights into your server’s traffic and performance.",
    images: ["https://nginx.aldotobing.online/assets/img/analyze.jpg"],
  },
  alternates: {
    canonical: "https://nginx.aldotobing.online",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Aldo Tobing" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Log Analyzer",
              url: "https://nginx.aldotobing.online",
              description:
                "Analyze your Nginx and Apache HTTPD logs with powerful insights into your server’s traffic and performance.",
              applicationCategory: "Utility",
              operatingSystem: "All",
              keywords: [
                "Log Analyzer",
                "Nginx logs",
                "Apache logs",
                "Server performance",
                "Traffic analysis",
                "Server monitoring",
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
