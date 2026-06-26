import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Sightfill | AI Customer Insights, Analytics & Forecasting Platform",
  description: "Transform raw sales data into actionable business intelligence with automated cleaning, customer segmentation, ML forecasting, and report generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col mesh-bg">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
