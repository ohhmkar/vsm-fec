import type { Metadata } from "next";
import { Geist_Mono, Outfit, Space_Grotesk } from "next/font/google";
import Background3D from "@/components/ui/Background3D";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FEC-VSM | Virtual Stock Market",
  description: "FEC Virtual Stock Market — A premium demo trading platform with real-time simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] relative">
        <Background3D />
        <div className="relative z-10 min-h-screen flex flex-col">
           {children}
        </div>
      </body>
    </html>
  );
}
