import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { HighContrastProvider } from "@/contexts/HighContrastContext";
import ThemeToggle from "@/components/ThemeToggle";
import SettingsIcon from "@/components/SettingsIcon";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ClimaGuard - AI-Powered Climate Risk Platform",
  description: "Protecting Mauritius from climate disasters with AI-powered cyclone and flood prediction. Real-time alerts via SMS, Telegram, and email.",
  keywords: "climate, cyclone, flood, prediction, AI, Mauritius, weather, alerts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <FontSizeProvider>
            <HighContrastProvider>
              {children}
              <SettingsIcon />
              <ThemeToggle />
            </HighContrastProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
