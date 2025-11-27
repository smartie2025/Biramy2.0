// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BIRAMY Galaxy",
  description: "AR try-on playground",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gradient-to-b from-white to-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
