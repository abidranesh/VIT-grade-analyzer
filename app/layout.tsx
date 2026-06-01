import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "VIT Grade Analyzer",
  description: "Transcript analysis & CGPA projection",
};

export const viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: "#000000", colorScheme: "dark" }}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

