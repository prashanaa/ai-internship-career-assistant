import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareerAssist - AI Internship & Career Assistant",
  description: "An intelligent career intelligence platform. Upload your resume, let AI validate your skills, projects, and certifications, and get matched to internships you actually qualify for.",
  keywords: ["CareerAssist", "internships", "AI resume analysis", "skill matching", "career assistant"],
  authors: [{ name: "CareerAssist" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CareerAssist - AI Internship & Career Assistant",
    description: "Upload your resume, let AI validate your qualifications, and get matched to internships.",
    siteName: "CareerAssist",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerAssist - AI Internship & Career Assistant",
    description: "AI-powered resume analysis and internship matching.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
