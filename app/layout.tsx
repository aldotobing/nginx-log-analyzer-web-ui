import type { Metadata } from "next";
import "./globals.css";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Log Analyzer",
  description:
    "Analyze and visualize your Nginx and Apache HTTPD logs with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Head>
        <title>Log Analyzer</title>
        <meta
          name="description"
          content="Analyze your Nginx and Apache HTTPD logs with powerful insights into your server’s traffic and performance."
        />
        <meta
          name="keywords"
          content="Nginx, Apache, Log Analyzer, Server Logs, Traffic Analysis, Performance Monitoring"
        />
        <meta name="author" content="Aldo Tobing" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://log-analyzer.aldotobing.online/"
        />
        <meta property="og:title" content="Log Analyzer" />
        <meta
          property="og:description"
          content="Analyze your Nginx and Apache HTTPD logs with powerful insights into your server’s traffic and performance."
        />
        <meta
          property="og:image"
          content="https://log-analyzer.aldotobing.online/assets/img/nginx.png"
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://log-analyzer.aldotobing.online/"
        />
        <meta property="twitter:title" content="Log Analyzer" />
        <meta
          property="twitter:description"
          content="Analyze your Nginx and Apache HTTPD logs with powerful insights into your server’s traffic and performance."
        />
        <meta
          property="twitter:image"
          content="https://log-analyzer.aldotobing.online/assets/img/nginx.png"
        />
      </Head>
      <html lang="en">
        <body>{children}</body>
      </html>
    </>
  );
}
