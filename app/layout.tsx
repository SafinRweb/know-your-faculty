import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Know Your Faculty — EWU",
  description: "Real reviews from EWU students. Know your faculty before you enroll.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <style>{`
          nav { position: fixed !important; top: 0 !important; }
        `}</style>
      </body>
    </html>
  );
}