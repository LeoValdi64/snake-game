import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "RetroSnake - Play the Classic Snake Game Online",
  description:
    "Play RetroSnake, a free online snake game with retro arcade style. Use arrow keys or swipe on mobile to control the snake, eat food, and beat your high score.",
  openGraph: {
    title: "RetroSnake - Play the Classic Snake Game Online",
    description:
      "Play RetroSnake, a free online snake game with retro arcade style. Use arrow keys or swipe on mobile to control the snake, eat food, and beat your high score.",
    images: ["/og-image.png"],
    url: "https://snake-game-smoky-five.vercel.app",
  },
  alternates: {
    canonical: "https://snake-game-smoky-five.vercel.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RetroSnake",
  description:
    "A free online snake game with retro arcade style. Control the snake, eat food, and beat your high score.",
  url: "https://snake-game-smoky-five.vercel.app",
  applicationCategory: "Game",
  genre: "Arcade",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
