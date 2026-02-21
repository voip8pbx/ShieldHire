import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import AlertListener from "@/components/AlertListener";

export const metadata: Metadata = {
  title: "Security Admin Dashboard - Bouncer Management System",
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
        <div className="flex min-h-screen bg-[var(--background)] font-sans text-[var(--text-primary)]">
          <Sidebar />
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-[var(--background)] p-8 custom-scrollbar">
              <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
