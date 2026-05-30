import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Eczar,
  Fraunces,
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Playfair_Display,
  Space_Grotesk,
  Syne,
  Young_Serif,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const eczar = Eczar({
  variable: "--font-eczar",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "YU ZIJIE Portfolio",
  description: "Premium minimalist portfolio built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${syne.variable} ${spaceGrotesk.variable} ${cormorant.variable} ${fraunces.variable} ${eczar.variable} ${playfairDisplay.variable} ${youngSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
