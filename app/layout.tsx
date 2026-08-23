import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EPOCH 2026 // Freshers Challenge",
  description: "Synchronized 10-Question 5-Minute Live Quiz Challenge · Powered by Epoch Creative",
  openGraph: {
    title: "EPOCH 2026 // Freshers Challenge",
    description: "Synchronized 10-Question 5-Minute Live Quiz Challenge",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased min-h-screen selection:bg-[#d4ff00] selection:text-black">
        {children}
      </body>
    </html>
  );
}

