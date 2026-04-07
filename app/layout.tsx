import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { DEFAULT_THEME, THEME_STORAGE_KEY, themeIds } from "@/lib/theme-options";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Metatron",
  description: "Metatron environmental monitoring dashboard.",
};

const themeInitScript = `(() => {
  try {
    const stored = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    const themes = new Set(${JSON.stringify(themeIds)});
    const theme = themes.has(stored) ? stored : "${DEFAULT_THEME}";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "${DEFAULT_THEME}";
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
