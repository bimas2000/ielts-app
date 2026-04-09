import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IELTS Pro — Personal Study App",
  description: "Personal IELTS preparation with AI feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <div className="flex h-full">
          <Sidebar />
          {/* pt-14 on mobile for fixed top bar, no padding on desktop */}
          <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
