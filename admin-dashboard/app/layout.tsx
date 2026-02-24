import type { Metadata } from "next";
import "./globals.css";
import AlertListener from "@/components/AlertListener";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "ShieldHire Admin Dashboard - Security Management System",
  description: "Professional admin dashboard for managing bouncer verifications, user engagements, and real-time location tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AlertListener />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}


