import type { Metadata } from "next";
import { Playfair_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import PlausibleProvider from "next-plausible";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bestreads - Book Discovery",
  description: "A ChatGPT App for discovering your next great read",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfairDisplay.variable} ${geistMono.variable} antialiased`}
      >
        <PlausibleProvider domain="bestreads.tomelliot.net">
          {children}
        </PlausibleProvider>
      </body>
    </html>
  );
}
