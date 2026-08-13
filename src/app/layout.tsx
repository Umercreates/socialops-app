import type { Metadata } from "next";
import { connection } from "next/server";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EasyLife — Social Media Management",
  description: "Manage every social account, post, and conversation from one workspace.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Forces this read to happen at request time rather than being inlined at
  // build time, so flipping AUTH_MODE in production takes effect on the
  // next request/restart without requiring a rebuild.
  await connection();
  const authMode = process.env.AUTH_MODE === "production" ? "production" : "mock";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider authMode={authMode}>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
