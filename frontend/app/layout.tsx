import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
<<<<<<< HEAD
import { Toaster } from "@/components/ui/toaster";
=======
import { ThemeProvider } from "@/components/theme-provider";
>>>>>>> auto-claude/003-

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "期货量化管理平台 - QuantFu",
  description: "期货持仓监控与管理系统",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuantFu",
  },
};

export const viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
<<<<<<< HEAD
        <AppShell>{children}</AppShell>
        <Toaster />
=======
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
>>>>>>> auto-claude/003-
      </body>
    </html>
  );
}
