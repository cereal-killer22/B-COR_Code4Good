import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { HighContrastProvider } from "@/contexts/HighContrastContext";
import { TextToSpeechProvider } from "@/contexts/TextToSpeechContext";
import { LayerToggleProvider } from "@/contexts/LayerToggleContext";
import ThemeToggle from "@/components/ThemeToggle";
import SettingsIcon from "@/components/SettingsIcon";
import ReadAllButton from "@/components/ReadAllButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ClimaGuard - AI-Powered Climate Risk Platform",
  description: "Protecting Mauritius from climate disasters with AI-powered cyclone and flood prediction. Real-time alerts via SMS, Radio Broadcast, and email.",
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
        {/* SVG filters for color-blind simulation */}
        <svg className="color-blind-filters" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, visibility: 'hidden' }}>
          <defs>
            {/* Protanopia (Red-blind) filter */}
            <filter id="protanopia-filter" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0.567 0.433 0 0 0
                        0.558 0.442 0 0 0
                        0 0.242 0.758 0 0
                        0 0 0 1 0"
              />
            </filter>
            {/* Deuteranopia (Green-blind) filter */}
            <filter id="deuteranopia-filter" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0.625 0.375 0 0 0
                        0.7 0.3 0 0 0
                        0 0.3 0.7 0 0
                        0 0 0 1 0"
              />
            </filter>
            {/* Tritanopia (Blue-blind) filter */}
            <filter id="tritanopia-filter" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0.95 0.05 0 0 0
                        0 0.433 0.567 0 0
                        0 0.475 0.525 0 0
                        0 0 0 1 0"
              />
            </filter>
          </defs>
        </svg>
        <ThemeProvider>
          <FontSizeProvider>
            <HighContrastProvider>
              <TextToSpeechProvider>
                <LayerToggleProvider>
                  {children}
                  <SettingsIcon />
                  <ThemeToggle />
                  <ReadAllButton />
                </LayerToggleProvider>
              </TextToSpeechProvider>
            </HighContrastProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
